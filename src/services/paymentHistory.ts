import logger from "@/src/libs/logger"
import {
    getUserPayments,
    getUserPaymentsCount,
    getUserTotalSpent,
    DBPaymentRow,
} from "@/src/repositories/payments/repo";
import {
    OrderStatusE,
    OrderTypeE,
    PaymentDisplayStatusE,
    PaymentHistoryItemI,
    PaymentHistoryResponseI,
    PaymentMethodE,
    PaymentOperationE,
} from "@/src/interfaces/payment";

const msgGlobal = "SERVICE PAYMENT-HISTORY "

const toDisplayId = (id: number): string => `PAY-${String(id).padStart(6, "0")}`

const toRubles = (row: DBPaymentRow): number =>
    row.ptype === OrderTypeE.Balance ? Number(row.amount) / 100 : Number(row.amount)

const detectAlfaMethod = (data: string | null): PaymentMethodE => {
    if (!data) return PaymentMethodE.Sbp
    try {
        const parsed = JSON.parse(data)
        const markers = `${parsed?.payment_system ?? ""} ${parsed?.payment_way ?? ""}`.toUpperCase()
        if (markers.includes("YANDEX") || markers.includes("APPLE") || markers.includes("GOOGLE")) {
            return PaymentMethodE.YandexPay
        }
        if (markers.includes("ALFA")) return PaymentMethodE.AlfaPay
        if (markers.includes("SBP") || markers.includes("СБП")) return PaymentMethodE.Sbp
        const card = parsed?.card
        const hasCard = !!(card && (card.pan || card.maskedPan || card.expiration))
        if (hasCard) return PaymentMethodE.Card
    } catch {
        return PaymentMethodE.Sbp
    }
    return PaymentMethodE.Sbp
}

export const detectPaymentMethod = (
    ptype: OrderTypeE,
    alphaId: string | null,
    data: string | null,
): PaymentMethodE => {
    if (ptype === OrderTypeE.OneTime && (!alphaId || alphaId === "")) {
        return PaymentMethodE.Balance
    }
    return detectAlfaMethod(data)
}

const resolveMethod = (row: DBPaymentRow): PaymentMethodE =>
    detectPaymentMethod(row.ptype, row.alpha_id, row.data)

const resolveOperation = (row: DBPaymentRow, method: PaymentMethodE): PaymentOperationE => {
    if (row.ptype === OrderTypeE.Balance) return PaymentOperationE.Topup
    if (method === PaymentMethodE.Balance) return PaymentOperationE.Charge
    return PaymentOperationE.Payment
}

const resolveStatus = (status: OrderStatusE): PaymentDisplayStatusE => {
    switch (status) {
        case OrderStatusE.Paid:
            return PaymentDisplayStatusE.Success
        case OrderStatusE.Error:
        case OrderStatusE.FinalFailed:
            return PaymentDisplayStatusE.Error
        case OrderStatusE.Unpaid:
            return PaymentDisplayStatusE.Cancelled
        default:
            return PaymentDisplayStatusE.Processing
    }
}

export const mapPaymentRow = (row: DBPaymentRow): PaymentHistoryItemI => {
    const method = resolveMethod(row)
    return {
        id: row.id.toString(),
        displayId: toDisplayId(row.id),
        createdAt: new Date(row.created_at).toISOString(),
        amount: toRubles(row),
        operation: resolveOperation(row, method),
        method,
        status: resolveStatus(row.status),
        questionId: row.question_id ?? null,
        questionUuid: row.question_uuid ?? null,
    }
}

export const getPaymentHistory = async (
    userId: string | number, page: number = 1, limit: number = 10
): Promise<PaymentHistoryResponseI> => {
    const msg = msgGlobal + "getPaymentHistory - "
    const [rows, count, totalSpent] = await Promise.all([
        getUserPayments(userId, page, limit),
        getUserPaymentsCount(userId),
        getUserTotalSpent(userId),
    ])
    logger.info(msg + "loaded", { user_id: userId, page, count })
    return {
        items: rows.map(mapPaymentRow),
        count,
        totalSpent,
    }
}
