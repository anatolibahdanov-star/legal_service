import logger from "@/src/libs/logger"
import { getAllUserPaymentsForAdmin } from "@/src/repositories/payments/repo"
import { adminAdjustBalance, getUserManualOperations } from "@/src/repositories/balances/repo"
import { accrueFreeQuestions, getUserFreeQuestionOperations } from "@/src/repositories/freeQuestions/repo"
import { getUserSubscriptionCancelEvents } from "@/src/repositories/subscriptions/repo"
import { mapPaymentRow } from "@/src/services/paymentHistory"
import {
    AdminBalanceOperationI,
    AdminOperationTypeE,
    FreeQuestionOpTypeE,
    PaymentDisplayStatusE,
    PaymentOperationE,
    SubscriptionEventE,
} from "@/src/interfaces/payment"

const freeQuestionTypes = new Set<AdminOperationTypeE>([
    AdminOperationTypeE.FreeAccrual,
    AdminOperationTypeE.FreeCharge,
    AdminOperationTypeE.FreeExpire,
])

const msgGlobal = "SERVICE ADMIN-OPERATIONS "

const formatActor = (name: string | null, username: string | null): string => {
    if (username) return `Admin (${username})`
    if (name) return `Admin (${name})`
    return "Администратор"
}

const withPlan = (comment: string | null, planName: string | null): string | null => {
    if (!planName) return comment
    const plan = `Тариф «${planName}»`
    return comment ? `${comment} · ${plan}` : plan
}

const subscriptionPaymentComment = (planName: string | null, subEvent: SubscriptionEventE | null): string => {
    const plan = planName ? ` «${planName}»` : ""
    switch (subEvent) {
        case SubscriptionEventE.Purchase:
            return `Покупка подписки${plan}`
        case SubscriptionEventE.Renew:
            return `Продление подписки${plan}`
        case SubscriptionEventE.Upgrade:
        case SubscriptionEventE.Downgrade:
            return `Переход на тариф${plan}`
        default:
            return planName ? `Подписка${plan}` : "Ежемесячная подписка"
    }
}

const mapPorderOperation = (
    operation: PaymentOperationE,
    amount: number,
    questionId: number | null,
    questionUuid: string | null,
    planName: string | null,
    subEvent: SubscriptionEventE | null,
): Pick<AdminBalanceOperationI, "type" | "amount" | "comment" | "actor" | "questionId" | "questionUuid"> | null => {
    switch (operation) {
        case PaymentOperationE.Payment:
            return { type: AdminOperationTypeE.Payment, amount, comment: null, actor: "Платёжная система", questionId, questionUuid }
        case PaymentOperationE.Topup:
            return { type: AdminOperationTypeE.Payment, amount, comment: "Пополнение баланса", actor: "Платёжная система", questionId: null, questionUuid: null }
        case PaymentOperationE.OneTimeTopup:
            return { type: AdminOperationTypeE.Payment, amount, comment: "Оплата разового вопроса", actor: "Платёжная система", questionId: null, questionUuid: null }
        case PaymentOperationE.SubscriptionPayment:
            return { type: AdminOperationTypeE.SubscriptionPayment, amount, comment: subscriptionPaymentComment(planName, subEvent), actor: "Платёжная система", questionId: null, questionUuid: null }
        case PaymentOperationE.Charge:
            return { type: AdminOperationTypeE.Charge, amount, comment: null, actor: "Система", questionId, questionUuid }
        default:
            return null
    }
}

export const getAdminUserOperations = async (
    userId: string | number,
    typeFilter: AdminOperationTypeE | "all" | "free" = "all",
): Promise<AdminBalanceOperationI[]> => {
    const msg = msgGlobal + "getAdminUserOperations - "
    const operationsCap = 2000
    const [porderRows, manualRows, freeRows, cancelRows] = await Promise.all([
        getAllUserPaymentsForAdmin(userId, operationsCap),
        getUserManualOperations(userId, operationsCap),
        getUserFreeQuestionOperations(userId, operationsCap),
        getUserSubscriptionCancelEvents(userId, operationsCap),
    ])

    const operations: AdminBalanceOperationI[] = []

    for (const row of porderRows) {
        const mapped = mapPaymentRow(row)
        if (mapped.status !== PaymentDisplayStatusE.Success) continue
        const op = mapPorderOperation(
            mapped.operation, mapped.amount, mapped.questionId, mapped.questionUuid,
            row.plan_name ?? null, row.sub_event ?? null,
        )
        if (!op) continue
        if (mapped.operation === PaymentOperationE.OneTimeTopup) {
            operations.push({
                id: `p-${mapped.id}-acc`,
                createdAt: mapped.createdAt,
                type: AdminOperationTypeE.OneTimeAccrual,
                amount: 1,
                comment: null,
                actor: "Платёжная система",
                questionId: null,
                questionUuid: null,
            })
        }
        operations.push({ id: `p-${mapped.id}`, createdAt: mapped.createdAt, ...op })
    }

    for (const row of manualRows) {
        const amount = Number(row.amount) / 100
        operations.push({
            id: `m-${row.id}`,
            createdAt: new Date(row.created_at).toISOString(),
            type: AdminOperationTypeE.Manual,
            amount,
            comment: row.comment ?? null,
            actor: formatActor(row.admin_name, row.admin_username),
            questionId: null,
            questionUuid: null,
        })
    }

    for (const row of freeRows) {
        let type: AdminOperationTypeE
        let actor: string
        switch (row.op_type) {
            case FreeQuestionOpTypeE.Accrual:
                type = AdminOperationTypeE.FreeAccrual
                actor = formatActor(row.admin_name, row.admin_username)
                break
            case FreeQuestionOpTypeE.SubscriptionAccrual:
                type = AdminOperationTypeE.FreeAccrual
                actor = "Подписка"
                break
            case FreeQuestionOpTypeE.Expire:
                type = AdminOperationTypeE.FreeExpire
                actor = "Система"
                break
            case FreeQuestionOpTypeE.Charge:
            default:
                type = AdminOperationTypeE.FreeCharge
                actor = "Система"
                break
        }
        operations.push({
            id: `f-${row.id}`,
            createdAt: new Date(row.created_at).toISOString(),
            type,
            amount: Number(row.amount),
            comment: withPlan(row.comment ?? null, row.plan_name ?? null),
            actor,
            questionId: row.question_id ?? null,
            questionUuid: row.question_uuid ?? null,
        })
    }

    for (const row of cancelRows) {
        operations.push({
            id: `s-${row.id}`,
            createdAt: new Date(row.created_at).toISOString(),
            type: AdminOperationTypeE.SubscriptionCancel,
            amount: 0,
            comment: withPlan(row.comment ?? null, row.plan_name ?? null),
            actor: row.admin_name || row.admin_username ? formatActor(row.admin_name, row.admin_username) : "Пользователь",
            questionId: null,
            questionUuid: null,
        })
    }

    operations.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const filtered =
        typeFilter === "all"
            ? operations
            : typeFilter === "free"
                ? operations.filter((o) => freeQuestionTypes.has(o.type))
                : operations.filter((o) => o.type === typeFilter)
    logger.info(msg + "loaded", { user_id: userId, total: operations.length, filtered: filtered.length })
    return filtered
}

export interface AdminTopUpResult {
    ok: boolean
    error?: string
}

export const adminTopUp = async (
    userId: string | number,
    amountRub: number,
    comment: string,
    adminId: number | null,
): Promise<AdminTopUpResult> => {
    const msg = msgGlobal + "adminTopUp - "
    if (!Number.isFinite(amountRub) || amountRub <= 0) {
        return { ok: false, error: "Сумма должна быть положительным числом." }
    }
    const trimmed = (comment ?? "").trim()
    if (trimmed.length === 0) {
        return { ok: false, error: "Комментарий обязателен." }
    }
    const amountKop = Math.round(amountRub * 100)
    const result = await adminAdjustBalance(userId, amountKop, adminId, trimmed)
    if (!result.ok) {
        logger.error(msg + "adjust failed", { user_id: userId, amountRub })
        return { ok: false, error: "Не удалось изменить баланс." }
    }
    logger.info(msg + "done", { user_id: userId, amountRub, admin_id: adminId })
    return { ok: true }
}

export const adminAccrueFreeQuestions = async (
    userId: string | number,
    count: number,
    comment: string,
    adminId: number | null,
): Promise<AdminTopUpResult> => {
    const msg = msgGlobal + "adminAccrueFreeQuestions - "
    if (!Number.isInteger(count) || count <= 0) {
        return { ok: false, error: "Количество вопросов должно быть положительным целым числом." }
    }
    const trimmed = (comment ?? "").trim()
    const result = await accrueFreeQuestions(userId, count, adminId, trimmed.length > 0 ? trimmed : null)
    if (!result.ok) {
        logger.error(msg + "accrue failed", { user_id: userId, count })
        return { ok: false, error: "Не удалось начислить бесплатные вопросы." }
    }
    logger.info(msg + "done", { user_id: userId, count, admin_id: adminId })
    return { ok: true }
}
