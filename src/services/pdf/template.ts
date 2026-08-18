import { format } from 'date-fns';
import { DBQuestion } from '@/src/interfaces/db';
import { toClientReply } from '@/src/libs/grokReply';

const COMPANY_NAME = 'ООО «ЭНКИ-Л»';
const COMPANY_OGRN = 'ОГРН 1267700058130';
const COMPANY_ADDRESS = '119435, город Москва, Саввинская наб, д. 9, помещ. 1/1';
const SITE_URL = 'https://enki.legal';
const CLOSING_TEAM = 'команда «Энки»';

/** Footer: brand + lawyer admin id (no personal name). */
function footerText(lawyerAdminId: string | number | null | undefined): string {
  const base = 'ЭНКИ • enki.legal • Конфиденциально';
  if (lawyerAdminId == null || lawyerAdminId === '') return base;
  return `${base} • Юрист #${lawyerAdminId}`;
}

/**
 * Prefer the admin who authored the latest non-empty final_reply,
 * else the lawyer assigned to the root question (`admin_id`).
 */
function resolveLawyerAdminId(root: DBQuestion, thread: DBQuestion[]): string | number | null {
  for (let i = thread.length - 1; i >= 0; i -= 1) {
    const m = thread[i];
    if (m.final_reply?.trim() && m.lawyer_admin_id != null) {
      return m.lawyer_admin_id;
    }
  }
  if (root.lawyer_admin_id != null) return root.lawyer_admin_id;
  if (root.admin_id != null) return root.admin_id;
  return null;
}

// Quarkdown is markdown-with-functions. Lines starting with `.` are parsed as
// function calls — for user-supplied content we must avoid that and also strip
// any backslashes/braces that could break the renderer. Inside `{...}` argument
// blocks we additionally escape closing braces.
function escapeInline(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/[{}]/g, (m) => '\\' + m);
}

function escapeBlock(text: string): string {
  if (!text) return '';
  // Prevent any line from starting with `.` — Quarkdown would interpret it as
  // a function. Prepend a zero-width space which renders invisibly.
  return text
    .split('\n')
    .map((line) => (line.startsWith('.') ? '​' + line : line))
    .join('\n');
}

/**
 * Strips HTML tags from rich-text replies stored in `final_reply` (the lawyer's
 * editor emits `<p>...</p>`, `<br>`, etc.). Preserves paragraph structure as
 * blank lines so Markdown still picks them up as separate paragraphs.
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<\/?(?:div|section|article)[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Sample-style datetime: `22.07.2026 (в 17:23)`. */
function formatSampleDateTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  try {
    return format(new Date(value), "dd.MM.yyyy '(в' HH:mm')'");
  } catch {
    return '';
  }
}

function displayName(root: DBQuestion): string {
  return (root.username ?? '').trim() || 'пользователя';
}

/** `Name, email, phone` — skips empty parts (sample DOCX framing). */
function formatUserRefs(root: DBQuestion): string {
  return [
    displayName(root),
    (root.email ?? '').trim(),
    (root.phone ?? '').trim(),
  ]
    .filter(Boolean)
    .join(', ');
}

function collectQuestionText(thread: DBQuestion[]): string {
  return thread
    .map((m) => (m.question ?? '').trim())
    .filter(Boolean)
    .join('\n\n');
}

function collectAnswerText(thread: DBQuestion[]): string {
  return thread
    .map((m) => toClientReply(stripHtml((m.final_reply ?? '').trim())))
    .filter(Boolean)
    .join('\n\n');
}

export interface QuarkdownTemplateInput {
  /** Parent question (root of the thread). */
  root: DBQuestion;
  /** Full thread sorted chronologically (root + replies + child questions). */
  thread: DBQuestion[];
  /** Absolute filesystem path to the logo PNG/SVG used in the page header. */
  logoPath: string;
  /** Absolute filesystem path to the facsimile signature PNG. */
  facsimilePath: string;
  fontPath: string;
}

/**
 * Builds a Quarkdown source document for a lawyer's answer PDF.
 *
 * Layout (aligned with the sample conclusion DOCX for outer framing):
 *  - Page header (every page): logo top-left + company details top-right
 *  - Body: intro with question quote → transition → answer text
 *  - Closing: «С уважением, команда „Энки“» + site URL + facsimile
 *  - Footer (every page): brand + lawyer admin id (system reference)
 */
export function buildQuarkdownSource(input: QuarkdownTemplateInput): string {
  const { root, thread, logoPath, facsimilePath, fontPath } = input;

  const consultationNumber = root.id;
  const lawyerAdminId = resolveLawyerAdminId(root, thread);
  const when = formatSampleDateTime(root.created_at as unknown as string);
  const userRefs = formatUserRefs(root);
  const questionText = collectQuestionText(thread);
  const answerText = collectAnswerText(thread);

  const intro =
    when && userRefs
      ? `**Данный ответ составляется на вопрос, полученный ${escapeInline(when)} от пользователя ${escapeInline(userRefs)}. Текст вопроса:**`
      : when
        ? `**Данный ответ составляется на вопрос, полученный ${escapeInline(when)}. Текст вопроса:**`
        : `**Данный ответ составляется на вопрос пользователя. Текст вопроса:**`;

  const transition = `**По итогам рассмотрения информации из вопроса можно сообщить следующее:**`;

  const quotedQuestion = questionText
    ? `«${escapeBlock(questionText)}»`
    : '_Текст вопроса отсутствует._';

  // Quarkdown source. Notes on the choices below:
  //  - `.doctype {paged}` is REQUIRED — the default `plain` doctype lays out
  //    everything in a single scrollable area and does NOT reserve space for
  //    `.pagemargin` boxes, so on multi-page output the body text bleeds
  //    straight through the header/footer regions (bug repro'd locally).
  //  - `.numbering headings:{none}` disables `paged`'s default `1.1.1`
  //    auto-numbering of headings.
  //  - The header is rendered as a single `.pagemargin {topleft}` containing
  //    a 16cm-wide `.row` so the credentials block stays on the right of the
  //    page (not constrained to the narrow ~5cm-wide default topright box).
  return [
    `.doctype {paged}`,
    `.numbering`,
    `    - headings: none`,
    `.docname {Юридическая консультация №${consultationNumber}}`,
    `.pageformat size:{A4} margin:{3cm}`,
    `.font {${escapeInline(fontPath)}} heading:{${escapeInline(fontPath)}} size:{11pt}`,
    ``,
    `.pagemargin {topleft}`,
    `    .container width:{16cm}`,
    `        .row alignment:{spacebetween} cross:{center} gap:{1cm}`,
    `            .container width:{3.5cm}`,
    `                ![Логотип ЭНКИ](${escapeInline(logoPath)})`,
    ``,
    `            .align {end}`,
    `                .text {${escapeInline(COMPANY_NAME)}} size:{small}.br .text {${escapeInline(COMPANY_OGRN)}} size:{small}.br .text {${escapeInline(COMPANY_ADDRESS)}} size:{small}`,
    ``,
    `.footer`,
    `    .container width:{16cm}`,
    `        .align {center}`,
    `            .text {${escapeInline(footerText(lawyerAdminId))}} size:{small}`,
    ``,
    intro,
    ``,
    quotedQuestion,
    ``,
    transition,
    ``,
    answerText ? escapeBlock(answerText) : '_Ответ пока не подготовлен._',
    ``,
    `.row alignment:{start} cross:{center} gap:{0.8cm}`,
    `    .container`,
    `        .text {С уважением,}.br .text {${escapeInline(CLOSING_TEAM)}}.br .text {${escapeInline(SITE_URL)}}`,
    ``,
    `    .container width:{9.5cm}`,
    `        ![Подпись](${escapeInline(facsimilePath)})`,
    ``,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n');
}
