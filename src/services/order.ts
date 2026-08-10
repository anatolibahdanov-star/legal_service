import logger from "@/src/libs/logger"
import { User } from "next-auth";

import { createEmptyOrder, getOrderById, updateClientOrder, updateClientOrderQR, updateOrderStatus, updateOrderQuestionLink } from '@/src/repositories/orders/repo';
import { updateWizardQuestionStatus } from '@/src/repositories/requests/repo';
import { DBOrder } from "@/src/interfaces/db"
import { AlfaOrderStatusE, OrderStatusE, OrderTypeE, newOrderResponse, checkOrderResponse, BalanceI, BalanceTypeE, BalanceStatusE, TransactionI, TransStatusE, TransTypeE } from '@/src/interfaces/payment';
import { QuestionStatusesE } from '@/src/interfaces/data';
import { UserBalanceRequest, PaymentInfoRequest, PaymentStatusUpdateI } from "@/src/interfaces/api";
import { createAlfaOrder, createAlfaBindingOrder, getAlfaOrderQR, getAlfaOrderStatus } from '@/src/libs/alfa.pay';
import { balanceIncrement } from "./balance";
import { hasOneTimeOrderFlag } from "./paymentHistory";
import { notifyBalanceTopupSuccess, notifyBalanceTopupFailure } from "./balanceNotify";
import { addTransaction } from "../repositories/transactions/repo";
import { applySubscriptionOrder } from "./subscription";

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

        // OneTime wizard orders carry the questionId — pre-link the FK
        // so admin queries (orders ↔ questions) work even if Alfa never
        // confirms (e.g. user abandons the redirect).
        if (balanceRequest.type === OrderTypeE.OneTime && balanceRequest.data?.questionId) {
            await updateOrderQuestionLink(emptyOrder.id, balanceRequest.data.questionId);
        }

        try {
            const trans: TransactionI = {
                order_id: parseInt(emptyOrder.id),
                status: TransStatusE.Success,
                trans_type: TransTypeE.Auto,
                data: null,
            }

            // 1. Request to Alfa API to create an SBP order.
            // OneTime приходит в рублях (getQuestionPrice/LK возвращают рубли) —
            // конвертим в копейки. Balance topup исторически уже идёт в копейках
            // (ProfileBalance отправляет «10000» → 100₽), его не трогаем.
            const alfaAmount = (balanceRequest.type === OrderTypeE.OneTime || balanceRequest.type === OrderTypeE.Subscription)
                ? Math.round(balanceRequest.amount * 100)
                : balanceRequest.amount
            const alfaCreatedOrder = balanceRequest.type === OrderTypeE.Subscription
                ? await createAlfaBindingOrder(alfaAmount, emptyOrder.id, user, user.id.toString())
                : await createAlfaOrder(alfaAmount, emptyOrder.id, user)
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

            // Subscription orders use a card form (formUrl), not an SBP QR —
            // the card entry is what creates the recurring binding. Skip the QR fetch.
            if (balanceRequest.type !== OrderTypeE.Subscription) {
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

        // For wizard one-shot card payments the question is created on
        // Step 3 of the wizard with status Unpaid. Its id travels along
        // the order via porder.data ({ questionId }) — capture it before
        // updateOrderStatus overwrites porder.data with Alfa transaction info.
        // The pre-existing `order.question_id` FK is filled at order-create
        // time, but we read from data first so the contract is explicit
        // and doesn't depend on column ordering.
        let oneTimeQuestionId: string | number | null = order.question_id ?? null;
        if (order.ptype === OrderTypeE.OneTime && order.data) {
            try {
                const parsed = JSON.parse(order.data);
                if (parsed?.questionId !== undefined && parsed.questionId !== null && parsed.questionId !== '') {
                    oneTimeQuestionId = parsed.questionId;
                }
            } catch (e) {
                logger.warn(msg + 'failed to parse OneTime order.data', { order_id: order.id, err: (e as Error).message });
            }
        }

        // Read planId from the durable column first; fall back to order.data
        // only if the column is empty (older rows). order.data is unreliable
        // here because updateOrderStatus overwrites it with transaction_info.
        let subscriptionPlanId: number | null = order.plan_id ?? null;
        if (order.ptype === OrderTypeE.Subscription && subscriptionPlanId === null && order.data) {
            try {
                const parsed = JSON.parse(order.data);
                if (parsed?.planId !== undefined && parsed.planId !== null && parsed.planId !== '') {
                    subscriptionPlanId = Number(parsed.planId);
                }
            } catch (e) {
                logger.warn(msg + 'failed to parse Subscription order.data', { order_id: order.id, err: (e as Error).message });
            }
        }

        const transaction: TransactionI = {
            order_id: parseInt(order.id),
            status: TransStatusE.Success,
            trans_type: TransTypeE.Auto,
            data: null,
        }

        const alfaOrder = await getAlfaOrderStatus(order.alpha_id, user, order.ptype === OrderTypeE.Subscription)
        transaction.data = alfaOrder.techical_data ?? null
        if (!alfaOrder.status) {
            const errorMsg = "Error on get order status in Alfa: "
            logger.error(msg + errorMsg, alfaOrder.error, user.id, slug)
            result.errors = [errorMsg]
            transaction.status = TransStatusE.Error
            await setDBTransaction(transaction, user)
            return result
        }
        

        // Register/Hold/New у Альфы — промежуточные статусы (платёж ещё в пути).
        // Держим заказ в InProgress, чтобы getActiveOrderByUserId/повторный
        // checkOrderStatus могли допросить Альфу до финала. Unpaid оставляем
        // только за реальными финальными провалами.
        let order_status: OrderStatusE
        switch (alfaOrder.data.orderStatus) {
            case AlfaOrderStatusE.Auth:
                order_status = OrderStatusE.Paid
                break
            case AlfaOrderStatusE.Register:
            case AlfaOrderStatusE.Hold:
            case AlfaOrderStatusE.New:
                order_status = OrderStatusE.InProgress
                break
            default:
                order_status = OrderStatusE.Error
        }
        
        const transaction_info = {
            ...(hasOneTimeOrderFlag(order.data) ? { oneTime: true } : {}),
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
                // The question was created on Step 3 (status=Unpaid);
                // here we only flip it to InProgress. No new row is inserted.
                if (oneTimeQuestionId === null) {
                    logger.error(msg + 'OneTime order paid but questionId missing', {
                        order_id: updatedOrderStatus.id,
                        user_id: user.id,
                    });
                } else {
                    const updatedQuestion = await updateWizardQuestionStatus(
                        oneTimeQuestionId,
                        QuestionStatusesE.InProgress,
                        user.id,
                    );
                    if (updatedQuestion) {
                        // Ensure the order ↔ question link is set (it may
                        // already be from create-time, but the call is idempotent).
                        await updateOrderQuestionLink(updatedOrderStatus.id, updatedQuestion.id);
                        logger.info(msg + 'OneTime: question status flipped to InProgress', {
                            order_id: updatedOrderStatus.id,
                            question_id: updatedQuestion.id,
                            user_id: user.id,
                        });
                    } else {
                        logger.error(msg + 'OneTime: failed to update question status after payment', {
                            order_id: updatedOrderStatus.id,
                            question_id: oneTimeQuestionId,
                            user_id: user.id,
                        });
                    }
                }
            } else if (updatedOrderStatus.ptype === OrderTypeE.Subscription) {
                if (subscriptionPlanId === null) {
                    logger.error(msg + 'Subscription order paid but planId missing', {
                        order_id: updatedOrderStatus.id,
                        user_id: user.id,
                    });
                } else {
                    const alfaBindingId = alfaOrder.data?.bindingInfo?.bindingId ?? alfaOrder.data?.bindingId ?? null;
                    const applied = await applySubscriptionOrder(
                        updatedOrderStatus.user_id,
                        subscriptionPlanId,
                        parseInt(updatedOrderStatus.id),
                        alfaBindingId,
                    );
                    if (applied.ok) {
                        logger.info(msg + 'Subscription applied', {
                            order_id: updatedOrderStatus.id,
                            user_id: updatedOrderStatus.user_id,
                            plan_id: subscriptionPlanId,
                            event: applied.event,
                            subscription_id: applied.subscriptionId,
                        });
                    } else {
                        logger.error(msg + 'Subscription apply failed after payment', {
                            order_id: updatedOrderStatus.id,
                            user_id: updatedOrderStatus.user_id,
                            plan_id: subscriptionPlanId,
                            error: applied.error,
                        });
                    }
                }
            } else {
                // Balance top-up — original behavior, increase user.balance.
                // Ledger data must fit balance.data varchar(300) — the full
                // transaction_info lives on the porder row, keep a summary here.
                const balance: BalanceI = {
                    amount: updatedOrderStatus.amount,
                    balance_type: BalanceTypeE.Increase,
                    user: user,
                    order: updatedOrderStatus,
                    status: BalanceStatusE.Success,
                    data: JSON.stringify({
                        order_number: transaction_info.order_number ?? null,
                        order_status: transaction_info.order_status ?? null,
                        amount: transaction_info.amount ?? null,
                        payment_system: transaction_info.payment_system ?? null,
                    }),
                }
                await balanceIncrement(balance)

                // Notify the user their balance was topped up. balanceIncrement
                // already committed, so user.balance is fresh for the email.
                await notifyBalanceTopupSuccess({
                    orderId: updatedOrderStatus.id,
                    userId: updatedOrderStatus.user_id,
                    amountKop: updatedOrderStatus.amount,
                    alphaId: updatedOrderStatus.alpha_id,
                    data: updateOrder.transaction_info,
                    eventAt: updatedOrderStatus.updated_at ?? updatedOrderStatus.created_at,
                })
            }
        } else if (order_status === OrderStatusE.Error && updatedOrderStatus.ptype === OrderTypeE.Balance) {
            // Terminal Alfa failure (decline/cancel/return) on a balance top-up.
            // This branch runs once: the next poll short-circuits on alpha_status.
            await notifyBalanceTopupFailure({
                orderId: updatedOrderStatus.id,
                userId: updatedOrderStatus.user_id,
                amountKop: updatedOrderStatus.amount,
                alphaId: updatedOrderStatus.alpha_id,
                data: updateOrder.transaction_info,
                eventAt: updatedOrderStatus.updated_at ?? updatedOrderStatus.created_at,
                reason: transaction_info.message ?? null,
            })
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