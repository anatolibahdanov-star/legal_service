import { format } from "date-fns"
import logger from "@/src/libs/logger"
import { getUsersByIds } from "@/src/repositories/users/repo"
import { getEmailTemplateByCode } from "@/src/repositories/emailTemplates/repo"
import { sendBalanceEmail } from "@/src/libs/email/senders"
import { detectPaymentMethod } from "./paymentHistory"
import { getQuestionPriceLK } from "./pricing"
import { isPhoneEmail } from "@/src/libs/phoneIdentity"
import { OrderTypeE, PaymentMethodE } from "@/src/interfaces/payment"

const msgGlobal = "SERVICE BALANCE-NOTIFY "

export const BALANCE_TOPUP_SUCCESS_CODE = "balance_topup_success"
export const BALANCE_TOPUP_FAIL_CODE = "balance_topup_fail"

const methodLabels: Record<PaymentMethodE, string> = {
    [PaymentMethodE.Card]: "Карта",
    [PaymentMethodE.Sbp]: "СБП",
    [PaymentMethodE.AlfaPay]: "Альфа Pay",
    [PaymentMethodE.YandexPay]: "Yandex Pay",
    [PaymentMethodE.Balance]: "Баланс",
}

// Hardcoded fallbacks — used only if the editable DB row is missing.
const DEFAULTS: Record<string, { subject: string; body: string; buttonLabel: string }> = {
    [BALANCE_TOPUP_SUCCESS_CODE]: {
        subject: "Баланс успешно пополнен",
        body: "Уважаемый(ая) {name}!\n\nВаш баланс успешно пополнен на сумму {amount} ₽.\n\nДетали операции:\n• ID платежа: {payment_id}\n• Дата и время: {datetime}\n• Способ оплаты: {method}\n\nТекущий баланс: {balance_questions} вопросов\n\nТеперь вы можете использовать средства для оплаты услуг на платформе.",
        buttonLabel: "Перейти в историю платежей",
    },
    [BALANCE_TOPUP_FAIL_CODE]: {
        subject: "Не удалось пополнить баланс",
        body: "Уважаемый(ая) {name}!\n\nК сожалению, не удалось пополнить баланс на сумму {amount} ₽.\n\nПричина: {error}\n\nПросим попробовать ещё раз или выбрать другой способ оплаты.",
        buttonLabel: "Пополнить баланс",
    },
}

export interface BalanceNotifyInput {
    /** porder.id — used to build the human-facing payment id (PAY-000123). */
    orderId: string | number
    userId: string | number
    /** Order amount in kopecks (Balance orders are stored in kopecks). */
    amountKop: number
    alphaId: string | null
    /** porder.data (Alfa transaction_info JSON) — used to detect the method. */
    data: string | null
    /** When the operation completed; defaults to now. */
    eventAt?: string | Date | null
    /** Failure reason (best-effort), only used by the failure email. */
    reason?: string | null
}

const displayPayId = (id: string | number): string => `PAY-${String(id).padStart(6, "0")}`

const formatAmount = (rub: number): string =>
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(rub)

const questionsFromBalance = (balanceRub: number): number => {
    const price = getQuestionPriceLK()
    if (!price || price <= 0) return 0
    return Math.max(0, Math.floor(balanceRub / price))
}

const profileUrl = (): string => {
    const base = (process.env.NEXT_PUBLIC_URL ?? process.env.NEXTAUTH_URL ?? "https://enki.legal").replace(/\/+$/, "")
    return `${base}/admin#/profile`
}

const renderPlaceholders = (tpl: string, vars: Record<string, string>): string =>
    tpl.replace(/\{(\w+)\}/g, (_m, key: string) => (key in vars ? vars[key] : `{${key}}`))

async function notify(code: string, input: BalanceNotifyInput, success: boolean): Promise<void> {
    const msg = msgGlobal + (success ? "success - " : "failure - ")
    try {
        const user = await getUsersByIds([String(input.userId)])
        if (!user) {
            logger.warn(msg + "user not found", { user_id: input.userId, order_id: input.orderId })
            return
        }
        // Wizard/phone-only users have a synthetic <phone>@... email — skip those.
        if (!user.email || isPhoneEmail(user.email)) {
            logger.info(msg + "no real email, skipping", { user_id: input.userId, order_id: input.orderId })
            return
        }

        const tpl = await getEmailTemplateByCode(code)
        if (tpl && tpl.is_active === 0) {
            logger.info(msg + "template disabled, skipping", { code })
            return
        }
        const fallback = DEFAULTS[code]
        const subject = (tpl?.subject || fallback.subject)
        const bodyTpl = (tpl?.body || fallback.body)
        const buttonLabel = (tpl?.button_label ?? fallback.buttonLabel) || ""

        const method = detectPaymentMethod(OrderTypeE.Balance, input.alphaId, input.data)
        const amountRub = input.amountKop / 100

        const vars: Record<string, string> = {
            name: (user.name || "").trim() || "клиент",
            amount: formatAmount(amountRub),
            payment_id: displayPayId(input.orderId),
            datetime: format(new Date(input.eventAt ?? Date.now()), "dd.MM.yyyy HH:mm"),
            method: methodLabels[method] ?? methodLabels[PaymentMethodE.Sbp],
            balance_questions: String(questionsFromBalance(Number(user.balance ?? 0))),
            error: (input.reason && input.reason.trim()) || "Платёж не был завершён",
        }

        const subjectRendered = renderPlaceholders(subject, vars)
        const bodyRendered = renderPlaceholders(bodyTpl, vars)

        await sendBalanceEmail({
            recipient: user.email,
            subject: subjectRendered,
            bodyText: bodyRendered,
            buttonLabel,
            buttonUrl: profileUrl(),
            success,
        })
    } catch (err) {
        // Never let notification failures break the payment flow.
        logger.error(msg + "failed to send", { order_id: input.orderId, err: (err as Error).message })
    }
}

export const notifyBalanceTopupSuccess = (input: BalanceNotifyInput): Promise<void> =>
    notify(BALANCE_TOPUP_SUCCESS_CODE, input, true)

export const notifyBalanceTopupFailure = (input: BalanceNotifyInput): Promise<void> =>
    notify(BALANCE_TOPUP_FAIL_CODE, input, false)
