import logger from "@/src/libs/logger"
import { getEmailTemplateByCode } from "@/src/repositories/emailTemplates/repo"
import { sendBrandedEmail } from "@/src/libs/email/senders"
import { isPhoneEmail } from "@/src/libs/phoneIdentity"

const msgGlobal = "SERVICE DOCUMENTS-NOTIFY "

export const DOCUMENTS_READY_CODE = "documents_ready"

// Hardcoded fallback — used only if the editable DB row is missing.
const DEFAULTS = {
    subject: "Документы по вашему запросу готовы — №{question_id}",
    body: "Уважаемый(ая) {user_name}!\n\nЮрист подготовил и опубликовал запрашиваемые документы по вашему делу.\n\n✅ Готовые документы:\n{documents}\n\nС полным комплектом документов вы можете ознакомиться по ссылке:\n{documents_url}\n\nВ личном кабинете вы также можете задать дополнительные вопросы юристу или оставить отзыв.",
    buttonLabel: "Скачать документы",
}

export interface DocumentsReadyNotifyInput {
    recipient: string
    userName: string
    /** Case / root question id shown to the user (Дело №…). */
    questionId: string | number
    /** Direct link to the case page where the documents are available. */
    documentsUrl: string
    /** Names of the formed documents, rendered as a bulleted list. */
    documentNames: string[]
}

const renderPlaceholders = (tpl: string, vars: Record<string, string>): string =>
    tpl.replace(/\{(\w+)\}/g, (_m, key: string) => (key in vars ? vars[key] : `{${key}}`))

/** Builds the "• Name" lines substituted into the {documents} placeholder. */
const renderDocumentList = (names: string[]): string => {
    // Collapse internal whitespace/newlines so a multi-line name can't break the
    // bullet rendering (each list item must stay on its own "• " line).
    const cleaned = (names ?? []).map((n) => (n ?? "").replace(/\s+/g, " ").trim()).filter((n) => n.length > 0)
    if (cleaned.length === 0) return "• —"
    return cleaned.map((n) => `• ${n}`).join("\n")
}

/**
 * Notifies the user that a lawyer has formed and published all requested
 * documents for their case. This is the TRIGGER for the (in-development)
 * document-formation feature: the publish-documents flow should call this with
 * the case recipient, the case page URL and the list of document names.
 *
 * Returns `true` when sent OR intentionally skipped (no real email / template
 * disabled); `false` only on an actual SendGrid failure.
 */
export async function notifyDocumentsReady(input: DocumentsReadyNotifyInput): Promise<boolean> {
    const msg = msgGlobal + "notifyDocumentsReady - "
    try {
        // Phone-only users carry a synthetic <phone>@… email — nothing to send.
        if (!input.recipient || isPhoneEmail(input.recipient)) {
            logger.info(msg + "no real email, skipping", { question_id: input.questionId })
            return true
        }

        const tpl = await getEmailTemplateByCode(DOCUMENTS_READY_CODE)
        if (tpl && tpl.is_active === 0) {
            logger.info(msg + "template disabled, skipping", { code: DOCUMENTS_READY_CODE })
            return true
        }
        const subjectTpl = tpl?.subject || DEFAULTS.subject
        const bodyTpl = tpl?.body || DEFAULTS.body
        const buttonLabel = (tpl?.button_label ?? DEFAULTS.buttonLabel) || ""

        const vars: Record<string, string> = {
            user_name: (input.userName || "").trim() || "клиент",
            question_id: String(input.questionId),
            documents_url: input.documentsUrl,
            documents: renderDocumentList(input.documentNames),
        }

        const sent = await sendBrandedEmail({
            recipient: input.recipient,
            subject: renderPlaceholders(subjectTpl, vars),
            bodyText: renderPlaceholders(bodyTpl, vars),
            buttonLabel,
            buttonUrl: input.documentsUrl,
        })
        return sent === true
    } catch (err) {
        logger.error(msg + "failed to send", { question_id: input.questionId, err: (err as Error).message })
        return false
    }
}
