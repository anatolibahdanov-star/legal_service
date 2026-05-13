import logger from "@/src/libs/logger"
import { User } from "next-auth";

import { createEmptyOrder, getOrderById, updateClientOrder, updateClientOrderQR, updateOrderStatus, updateOrderQuestionLink } from '@/src/repositories/orders/repo';
import { addWizardQuestion } from '@/src/repositories/requests/repo';
import { DBOrder } from "@/src/interfaces/db"
import { AlfaOrderStatusE, OrderStatusE, OrderTypeE, newOrderResponse, checkOrderResponse, BalanceI, BalanceTypeE, BalanceStatusE, TransactionI, TransStatusE, TransTypeE } from '@/src/interfaces/payment';
import { QuestionStatusesE } from '@/src/interfaces/data';
import { UserBalanceRequest, PaymentInfoRequest, PaymentStatusUpdateI } from "@/src/interfaces/api";
import { createAlfaOrder, getAlfaOrderQR, getAlfaOrderStatus } from '@/src/libs/alfa.pay';
import { balanceIncrement } from "./balance";
import { addTransaction } from "../repositories/transactions/repo";

const msgGlobal = "SERVICE ORDER "

export const initNewOrder = async (balanceRequest: UserBalanceRequest, user: User): Promise<newOrderResponse> => {
    const msg = msgGlobal + "initNewOrder - ";
    const result: newOrderResponse = {status: false, order: null, errors: null,}
    let order: DBOrder | null = null
    try {
    
        balanceRequest.status = OrderStatusE.New
        // Honor the client-supplied order type (Balance for top-ups,
        // OneTime for one-shot question payments via wizard). Default
        // to Balance for backward compatibility with existing callers.
        balanceRequest.type = balanceRequest.type ?? OrderTypeE.Balance
        const emptyOrder = await createEmptyOrder(user.id, balanceRequest)
        if(emptyOrder === null) {
            const error = "Empty response on create order"
            logger.error(msg + error, user.id, balanceRequest)
            result.errors = [error]
            return result
        }

        try {
            const trans: TransactionI = {
                order_id: parseInt(emptyOrder.id),
                status: TransStatusE.Success,
                trans_type: TransTypeE.Auto,
                data: null,
            }

            // 1. Request to Alfa API to create an SBP order
            const alfaCreatedOrder = await createAlfaOrder(balanceRequest.amount, emptyOrder.id, user)
            trans.data = alfaCreatedOrder.techical_data ?? null
            if (!alfaCreatedOrder.status) {
                const error = "Error on order create in Alfa: "
                logger.error(msg + error + alfaCreatedOrder.error, user.id, balanceRequest)
                result.errors = [error]
                
                trans.status = TransStatusE.Error
                await setDBTransaction(trans, user)
                return result
            }

            await setDBTransaction(trans, user)

            // 2. Fetch QR data (e.g. payment URL)
            // Bank returns orderId; fetch the QR code separately if it doesn't arrive immediately
            const updateOrder: PaymentInfoRequest = {
                order_id: emptyOrder.id,
                alpha_id: alfaCreatedOrder.data.orderId,
                alpha_form_url: alfaCreatedOrder.data.formUrl,
                alpha_status: AlfaOrderStatusE.Register,
                status: OrderStatusE.InProgress,
            }

            order = await updateClientOrder(updateOrder)
            if(order === null) {
                const error = "Empty response from updateClientOrder"
                logger.error(msg + error, updateOrder)
                result.errors = [error]
                return result
            }

            const alfaOrderWithQR = await getAlfaOrderQR(order.alpha_id, user)
            trans.data = alfaOrderWithQR.techical_data ?? null
            if (!alfaOrderWithQR.status) {
                const error = "Error in get QR in Alfa: "
                logger.error(msg + error + alfaOrderWithQR.error, user.id, balanceRequest)
                result.errors = [error]
                trans.status = TransStatusE.Error
                await setDBTransaction(trans, user)
                return result
            }
            await setDBTransaction(trans, user)

            order = await updateClientOrderQR(emptyOrder.id, alfaOrderWithQR.data.payload)
            if(order === null) {
                const error = "Empty response from updateClientOrderQR"
                logger.error(msg + error + alfaOrderWithQR.error, updateOrder)
                result.errors = [error]
                return result
            }

        } catch (error) {
            const errorMsg = "Error during sending payment request"
            logger.error(msg + errorMsg, (error as Error).message, (error as Error))
            result.errors = [errorMsg]
            return result
        }

    } catch(error) {
        const errorMsg = "Error during create new payment order"
        logger.error(msg + errorMsg, (error as Error).message, (error as Error))
        result.errors = [errorMsg]
        return result
    }

    result.status = true
    result.order = order
    result.errors = null
    return result;
}

export const checkOrderStatus = async (slug:string, user: User): Promise<checkOrderResponse> => {
    const msg = "SERVICE ORDER checkOrderStatus ";
    const result: newOrderResponse = {status: false, order: null, errors: null,}
    let order: DBOrder | null = null
    logger.info(msg + "params", slug, user)
    try {
        order = await getOrderById(slug, false)
        logger.info(msg + 'order', order)
        if (order === null) {
            const errorMsg = 'order not found.'
            logger.error(msg + errorMsg, user.id, slug)
            result.errors = [errorMsg]
            return result
        }
        if (order.alpha_status > 1 && order.alpha_status !== AlfaOrderStatusE.New) {
            result.status = true
            result.order = order
            result.errors = null
            return result
        }

        // For wizard one-shot card payments we need the question text before
        // updateOrderStatus overwrites porder.data with the Alfa transaction info.
        let oneTimeQuestionText: string | null = null;
        if (order.ptype === OrderTypeE.OneTime && order.data) {
            try {
                const parsed = JSON.parse(order.data);
                if (typeof parsed?.question === 'string' && parsed.question.trim().length > 0) {
                    oneTimeQuestionText = parsed.question.trim();
                }
            } catch (e) {
                logger.warn(msg + 'failed to parse OneTime order.data', { order_id: order.id, err: (e as Error).message });
            }
        }

        const transaction: TransactionI = {
            order_id: parseInt(order.id),
            status: TransStatusE.Success,
            trans_type: TransTypeE.Auto,
            data: null,
        }

        const alfaOrder = await getAlfaOrderStatus(order.alpha_id, user)
        transaction.data = alfaOrder.techical_data ?? null
        if (!alfaOrder.status) {
            const errorMsg = "Error on get order status in Alfa: "
            logger.error(msg + errorMsg, alfaOrder.error, user.id, slug)
            result.errors = [errorMsg]
            transaction.status = TransStatusE.Error
            await setDBTransaction(transaction, user)
            return result
        }
        

        const order_status = [AlfaOrderStatusE.Register, AlfaOrderStatusE.Hold].includes(alfaOrder.data.orderStatus) ?
            OrderStatusE.Unpaid:
            (
                alfaOrder.data.orderStatus === AlfaOrderStatusE.Auth ? 
                OrderStatusE.Paid : OrderStatusE.Error
            )
        
        const transaction_info = {
            transaction: alfaOrder.data.transactionAttributes,
            card: alfaOrder.data.cardAuthInfo,
            attributes: alfaOrder.data.attributes,
            amount: alfaOrder.data.amount,
            currency: alfaOrder.data.currency,
            ip: alfaOrder.data.ip,
            payment_system: alfaOrder.data.paymentSystem,
            payment_way: alfaOrder.data.paymentWay,
            message: alfaOrder.data.errorMessage,
            order_number: alfaOrder.data.orderNumber,
            order_status: alfaOrder.data.orderStatus,
            action_code: alfaOrder.data.actionCode,
            payment_amount_info: alfaOrder.data.paymentAmountInfo,
        }
        transaction.data = transaction_info
        await setDBTransaction(transaction, user)

        const updateOrder: PaymentStatusUpdateI = {
            order_id: order.id,
            status: order_status,
            alpha_id: order.alpha_id,
            alpha_status: alfaOrder.data.orderStatus,
            transaction_info: JSON.stringify(transaction_info)
        }
        const updatedOrderStatus = await updateOrderStatus(updateOrder)
        if (updatedOrderStatus === null) {
            const errorMsg = 'order not found after update.'
            logger.error(msg + errorMsg, alfaOrder.error, user.id, slug)
            result.errors = [errorMsg]
            return result
        }

        if(updatedOrderStatus.alpha_status === AlfaOrderStatusE.Auth) {
            if (updatedOrderStatus.ptype === OrderTypeE.OneTime) {
                // Wizard one-shot payment for a single question.
                // Money goes to the question, NOT to the balance.
                if (!oneTimeQuestionText) {
                    logger.error(msg + 'OneTime order paid but question text missing in data', {
                        order_id: updatedOrderStatus.id,
                        user_id: user.id,
                    });
                } else {
                    logger.info(msg + 'OneTime paid — creating question', {
                        order_id: updatedOrderStatus.id,
                        user_id: user.id,
                    });
                    const question = await addWizardQuestion(
                        user.id,
                        oneTimeQuestionText,
                        QuestionStatusesE.InProgress,
                    );
                    if (question) {
                        await updateOrderQuestionLink(updatedOrderStatus.id, question.id);
                        logger.info(msg + 'OneTime: question created and linked', {
                            order_id: updatedOrderStatus.id,
                            question_id: question.id,
                            user_id: user.id,
                        });
                    } else {
                        logger.error(msg + 'OneTime: failed to create question after payment', {
                            order_id: updatedOrderStatus.id,
                            user_id: user.id,
                        });
                    }
                }
            } else {
                // Balance top-up — original behavior, increase user.balance.
                const balance: BalanceI = {
                    amount: updatedOrderStatus.amount,
                    balance_type: BalanceTypeE.Increase,
                    user: user,
                    order: updatedOrderStatus,
                    status: BalanceStatusE.Success,
                    data: updateOrder.transaction_info,
                }
                await balanceIncrement(balance)
            }
        }

        order = updatedOrderStatus

    } catch(err) {
        const errorMsg = 'error during get data.'
        logger.error(msg + errorMsg,(err as Error), user.id, slug)
        result.errors = [errorMsg]
        return result
    }

    result.status = true
    result.order = order
    result.errors = null
    return result
}

const setDBTransaction = async (trans: TransactionI, user: User) => {
    const msg = "SERVICE ORDER setDBTransaction - "
    const transactionData = addTransaction(trans)
    if (transactionData === null) {
        const errorMsg = 'Error during transaction save.'
        logger.error(msg + errorMsg, transactionData, user.id, trans)
    }
}