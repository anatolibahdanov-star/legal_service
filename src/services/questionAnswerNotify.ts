import logger from "@/src/libs/logger"
import { getEmailTemplateByCode } from "@/src/repositories/emailTemplates/repo"
import { SendSendGridBrandedEmail } from "@/src/libs/sendgrid"
import { isPhoneEmail } from "@/src/libs/phoneIdentity"

const msgGlobal = "SERVICE QUESTION-ANSWER-NOTIFY "

export const QUESTION_ANSWER_FIRST_CODE = "question_answer_first"
export const QUESTION_ANSWER_CLARIFYING_CODE = "question_answer_clarifying"

// Hardcoded fallbacks — used only if the editable DB row is missing.
const DEFAULTS: Record<string, { subject: string; body: string; buttonLabel: string }> = {
    [QUESTION_ANSWER_FIRST_CODE]: {
        subject: "Юрист ответил на ваш вопрос №{question_id}",
        body: "Уважаемый(ая) {user_name}!\n\nЮрист опубликовал ответ на ваш вопрос №{question_id}.\n\nВ личном кабинете вы также можете задать дополнительные вопросы или оценить работу юриста.",
        buttonLabel: "Перейти к ответу",
    },
    [QUESTION_ANSWER_CLARIFYING_CODE]: {
        subject: "Юрист ответил на уточняющие вопросы по делу №{question_id}",
        body: "Уважаемый(ая) {user_name}!\n\nЮрист ответил на все уточняющие вопросы по Вашему делу.\n\nС полным текстом вопроса и всех ответов юриста вы можете ознакомиться по ссылке ниже.\n\nВ личном кабинете вы также можете задать дополнительные вопросы или оценить работу юриста.",
        buttonLabel: "Перейти к ответу",
    },
}

export interface QuestionAnswerNotifyInput {
    recipient: string
    userName: string
    /** Case / root question id shown to the user (Дело №…). */
    questionId: string | number
    /** Direct link to the consultation page (/consultation/{uuid}/). */
    questionUrl: string
    /** true → answer to a clarifying follow-up; false → first answer. */
    isClarifying: boolean
}

const renderPlaceholders = (tpl: string, vars: Record<string, string>): string =>
    tpl.replace(/\{(\w+)\}/g, (_m, key: string) => (key in vars ? vars[key] : `{${key}}`))

/**
 * Notifies the user that a lawyer published an answer to their question.
 * Picks the "first answer" or "clarifying answer" editable template based on
 * `isClarifying`, substitutes placeholders, and sends it in the branded shell.
 *
 * Returns `true` when sent OR intentionally skipped (no real email / template
 * disabled) so the caller marks email_status as handled; `false` only on an
 * actual SendGrid failure.
 */
export async function notifyQuestionAnswer(input: QuestionAnswerNotifyInput): Promise<boolean> {
    const msg = msgGlobal + (input.isClarifying ? "clarifying - " : "first - ")
    try {
        // Phone-only users carry a synthetic <phone>@… email — nothing to send.
        if (!input.recipient || isPhoneEmail(input.recipient)) {
            logger.info(msg + "no real email, skipping", { question_id: input.questionId })
            return true
        }

        const code = input.isClarifying ? QUESTION_ANSWER_CLARIFYING_CODE : QUESTION_ANSWER_FIRST_CODE
        const tpl = await getEmailTemplateByCode(code)
        if (tpl && tpl.is_active === 0) {
            logger.info(msg + "template disabled, skipping", { code })
            return true
        }
        const fallback = DEFAULTS[code]
        const subjectTpl = tpl?.subject || fallback.subject
        const bodyTpl = tpl?.body || fallback.body
        const buttonLabel = (tpl?.button_label ?? fallback.buttonLabel) || ""

        const vars: Record<string, string> = {
            user_name: (input.userName || "").trim() || "клиент",
            question_id: String(input.questionId),
            question_url: input.questionUrl,
        }

        const sent = await SendSendGridBrandedEmail({
            recipient: input.recipient,
            subject: renderPlaceholders(subjectTpl, vars),
            bodyText: renderPlaceholders(bodyTpl, vars),
            buttonLabel,
            buttonUrl: input.questionUrl,
        })
        // SendSendGridBrandedEmail returns null only on missing fields (treated
        // as a real failure here) and false on a SendGrid error.
        return sent === true
    } catch (err) {
        logger.error(msg + "failed to send", { question_id: input.questionId, err: (err as Error).message })
        return false
    }
}
