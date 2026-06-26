import logger from "@/src/libs/logger"
import { getEmailTemplateByCode } from "@/src/repositories/emailTemplates/repo"
import { SendSendGridBrandedEmail } from "@/src/libs/sendgrid"
import { isPhoneEmail } from "@/src/libs/phoneIdentity"

const msgGlobal = "SERVICE UNPAID-REMINDER-NOTIFY "

export const UNPAID_REMINDER_CODE = "unpaid_reminder"

// Hardcoded fallback — used only if the editable DB row is missing.
const DEFAULTS = {
    subject: "Ваш вопрос №{question_id} ожидает оплаты",
    body: "Уважаемый(ая) {user_name}!\n\nМы заметили, что у вас есть вопрос №{question_id}, который ожидает оплаты.\n\nКак только оплата будет произведена, наш юрист незамедлительно приступит к работе над ним.\n\nЕсли вопрос всё ещё актуален, пополните, пожалуйста, баланс здесь:\n{payment_url}\n\nСпасибо, что доверяете нам!",
    buttonLabel: "Пополнить баланс",
}

export interface UnpaidReminderInput {
    recipient: string
    userName: string
    /** Earliest unpaid question id for the user (Вопрос №…). */
    questionId: string | number
    /** Where the user tops up their balance / pays the question. */
    paymentUrl: string
}

/**
 * - "sent"    — email actually delivered to SendGrid (latch the reminder).
 * - "skipped" — nothing sent on purpose (no real email / template disabled);
 *               do NOT latch, so re-enabling the template still reminds.
 * - "failed"  — a real send error; do NOT latch, retry next run.
 */
export type UnpaidReminderResult = "sent" | "skipped" | "failed"

const renderPlaceholders = (tpl: string, vars: Record<string, string>): string =>
    tpl.replace(/\{(\w+)\}/g, (_m, key: string) => (key in vars ? vars[key] : `{${key}}`))

/**
 * Sends the one-time "you have an unpaid question — top up your balance"
 * reminder. The tri-state result lets the cron latch the reminder ONLY when an
 * email was really sent (see UnpaidReminderResult).
 */
export async function notifyUnpaidReminder(input: UnpaidReminderInput): Promise<UnpaidReminderResult> {
    const msg = msgGlobal + "notifyUnpaidReminder - "
    try {
        if (!input.recipient || isPhoneEmail(input.recipient)) {
            logger.info(msg + "no real email, skipping", { question_id: input.questionId })
            return "skipped"
        }

        const tpl = await getEmailTemplateByCode(UNPAID_REMINDER_CODE)
        if (tpl && tpl.is_active === 0) {
            logger.info(msg + "template disabled, skipping", { code: UNPAID_REMINDER_CODE })
            return "skipped"
        }
        const subjectTpl = tpl?.subject || DEFAULTS.subject
        const bodyTpl = tpl?.body || DEFAULTS.body
        const buttonLabel = (tpl?.button_label ?? DEFAULTS.buttonLabel) || ""

        const vars: Record<string, string> = {
            user_name: (input.userName || "").trim() || "клиент",
            question_id: String(input.questionId),
            payment_url: input.paymentUrl,
        }

        const sent = await SendSendGridBrandedEmail({
            recipient: input.recipient,
            subject: renderPlaceholders(subjectTpl, vars),
            bodyText: renderPlaceholders(bodyTpl, vars),
            buttonLabel,
            buttonUrl: input.paymentUrl,
        })
        return sent === true ? "sent" : "failed"
    } catch (err) {
        logger.error(msg + "failed to send", { question_id: input.questionId, err: (err as Error).message })
        return "failed"
    }
}
