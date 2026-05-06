import logger from "@/src/libs/logger"
import { User } from "next-auth";

import { createEmptyOrder, getOrderById, updateClientOrder, updateClientOrderQR, updateOrderStatus } from '@/src/repositories/orders/repo';
import { DBOrder } from "@/src/interfaces/db"
import { AlfaOrderStatusE, OrderStatusE, OrderTypeE, newOrderResponse, checkOrderResponse, BalanceI, BalanceTypeE, BalanceStatusE, TransactionI, TransStatusE, TransTypeE } from '@/src/interfaces/payment';
import { UserBalanceRequest, PaymentInfoRequest, PaymentStatusUpdateI } from "@/src/interfaces/api";
import { createAlfaOrder, getAlfaOrderQR, getAlfaOrderStatus } from '@/src/libs/alfa.pay';
import { balanceIncrement } from "./balance";
import { addTransaction } from "../repositories/transactions/repo";

export const initNewOrder = async (balanceRequest: UserBalanceRequest, user: User): Promise<newOrderResponse> => {
    const msg = "SERVICE ORDER initNewOrder";
    const result: newOrderResponse = {
        status: false,
        order: null,
        errors: null,
    }
    let order: DBOrder | null = null
    try {
    
        balanceRequest.status = OrderStatusE.New
        balanceRequest.type = OrderTypeE.Balance
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

            // 1. Запрос к Альфа API для создания СБП заказа
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

            // 2. Получение данных для QR (например, URL на оплату)
            // Банк возвращает orderId, нужно запросить qr-код отдельно, если не пришел сразу
            const updateOrder: PaymentInfoRequest = {
                order_id: emptyOrder.id,
                alpha_id: alfaCreatedOrder.data.orderId,
                alpha_form_url: alfaCreatedOrder.data.formUrl,
                alpha_status: AlfaOrderStatusE.Register,
                status: OrderStatusE.InProgress,
            }

            logger.info("Before update ", updateOrder)
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
    const msg = "SERVICE ORDER checkOrderStatus";
    const result: newOrderResponse = {
        status: false,
        order: null,
        errors: null,
    }
    let order: DBOrder | null = null
    try {
        order = await getOrderById(slug)
        // console.log(msg + 'order', order)
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