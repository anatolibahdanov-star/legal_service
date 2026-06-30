import logger from "@/src/libs/logger"
import { getAllUserPaymentsForAdmin } from "@/src/repositories/payments/repo"
import { adminAdjustBalance, getUserManualOperations } from "@/src/repositories/balances/repo"
import { accrueFreeQuestions, getUserFreeQuestionOperations } from "@/src/repositories/freeQuestions/repo"
import { mapPaymentRow } from "@/src/services/paymentHistory"
import {
    AdminBalanceOperationI,
    AdminOperationTypeE,
    FreeQuestionOpTypeE,
    PaymentDisplayStatusE,
    PaymentOperationE,
} from "@/src/interfaces/payment"

const freeQuestionTypes = new Set<AdminOperationTypeE>([
    AdminOperationTypeE.FreeAccrual,
    AdminOperationTypeE.FreeCharge,
])

const msgGlobal = "SERVICE ADMIN-OPERATIONS "

const formatActor = (name: string | null, username: string | null): string => {
    if (username) return `Admin (${username})`
    if (name) return `Admin (${name})`
    return "Администратор"
}

const mapPorderOperation = (
    operation: PaymentOperationE,
    amount: number,
    questionId: number | null,
    questionUuid: string | null,
): Pick<AdminBalanceOperationI, "type" | "amount" | "comment" | "actor" | "questionId" | "questionUuid"> | null => {
    switch (operation) {
        case PaymentOperationE.Payment:
            return { type: AdminOperationTypeE.Payment, amount, comment: null, actor: "Платёжная система", questionId, questionUuid }
        case PaymentOperationE.Topup:
            return { type: AdminOperationTypeE.Payment, amount, comment: "Пополнение баланса", actor: "Платёжная система", questionId: null, questionUuid: null }
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
    const [porderRows, manualRows, freeRows] = await Promise.all([
        getAllUserPaymentsForAdmin(userId, operationsCap),
        getUserManualOperations(userId, operationsCap),
        getUserFreeQuestionOperations(userId, operationsCap),
    ])

    const operations: AdminBalanceOperationI[] = []

    for (const row of porderRows) {
        const mapped = mapPaymentRow(row)
        if (mapped.status !== PaymentDisplayStatusE.Success) continue
        const op = mapPorderOperation(mapped.operation, mapped.amount, mapped.questionId, mapped.questionUuid)
        if (!op) continue
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
        const isAccrual = row.op_type === FreeQuestionOpTypeE.Accrual
        operations.push({
            id: `f-${row.id}`,
            createdAt: new Date(row.created_at).toISOString(),
            type: isAccrual ? AdminOperationTypeE.FreeAccrual : AdminOperationTypeE.FreeCharge,
            amount: Number(row.amount),
            comment: row.comment ?? null,
            actor: isAccrual ? formatActor(row.admin_name, row.admin_username) : "Система",
            questionId: row.question_id ?? null,
            questionUuid: row.question_uuid ?? null,
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
