import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DBQuestion } from '@/src/interfaces/db';

const COMPANY_NAME = 'ООО «ЭНКИ-Л»';
const COMPANY_OGRN = 'ОГРН 1267700058130';
const COMPANY_ADDRESS = '119435, город Москва, Саввинская наб, д. 9, помещ. 1/1';
const FOOTER_TEXT = 'ЭНКИ • enki.legal • Конфиденциально';
const DEFAULT_LAWYER_POSITION = 'Юрист';

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

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  try {
    return format(new Date(value), 'd MMMM yyyy', { locale: ru });
  } catch {
    return '';
  }
}

export interface QuarkdownTemplateInput {
  /** Parent question (root of the thread). */
  root: DBQuestion;
  /** Full thread sorted chronologically (root + replies + child questions). */
  thread: DBQuestion[];
  /** Absolute filesystem path to the logo PNG/SVG used in the page header. */
  logoPath: string;
}

/**
 * Builds a Quarkdown source document for a lawyer's answer PDF.
 *
 * Layout (per requirements):
 *  - Page header (every page): logo top-left + company details top-right
 *  - Body: date, recipient, subject, dialog in chronological order
 *  - End-of-doc closing: lawyer name + position
 *  - Footer (every page): «ЭНКИ • enki.legal • Конфиденциально»
 */
export function buildQuarkdownSource(input: QuarkdownTemplateInput): string {
  const { root, thread, logoPath } = input;

  const recipientName = (root.username ?? '').trim();
  const subject = (root.category_name ?? '').trim();
  const issuedAt = formatDate(root.created_at as unknown as string);

  // Lawyer who provided the final answer — take the most recent message with a
  // non-empty `final_reply.lawyer`. Fall back to the parent `owner`.
  const lawyerName = (() => {
    for (let i = thread.length - 1; i >= 0; i -= 1) {
      const m = thread[i];
      if (m.final_reply && m.final_reply.trim() && m.lawyer && m.lawyer.trim()) {
        return m.lawyer.trim();
      }
    }
    return root.lawyer?.trim() || root.owner?.trim() || '';
  })();

  const dialogBlocks = thread
    .map((message) => renderDialogMessage(message))
    .filter((block) => block.length > 0)
    .join('\n\n---\n\n');

  // Quarkdown source. Doctype is left as default (`paged`) — `plain` would
  // strip page-level concepts (page margins, footer) which we rely on for the
  // letterhead. `<br>` is used inside `.pagemargin {topright}` so the company
  // details stack as three lines instead of flowing as one paragraph.
  return [
    `.docname {Ответ юриста #${root.id}}`,
    `.pageformat size:{A4} margin:{2cm}`,
    `.font {GoogleFonts:Inter} heading:{GoogleFonts:Inter} size:{11pt}`,
    ``,
    // Logo image is wrapped in a `.container width:{...}` so it doesn't render
    // at its native pixel size (the source PNG is ~1000px wide, which would
    // span the whole page without constraint).
    `.pagemargin {topleft}`,
    `    .container width:{4cm}`,
    `        ![Логотип ЭНКИ](${escapeInline(logoPath)})`,
    ``,
    // Bare markdown with two trailing spaces on each line = hard line break
    // (renders as a tight stack of 3 lines, no paragraph spacing). `.align
    // {end}` right-aligns the whole block so company info hugs the right page
    // margin (matches the letterhead reference).
    `.pagemargin {topright}`,
    `    .align {end}`,
    `        ${escapeInline(COMPANY_NAME)}  `,
    `        ${escapeInline(COMPANY_OGRN)}  `,
    `        ${escapeInline(COMPANY_ADDRESS)}`,
    ``,
    `.footer`,
    `    ${escapeInline(FOOTER_TEXT)}`,
    ``,
    `### Юридическая консультация №${root.id}`,
    ``,
    `**Дата:** ${escapeInline(issuedAt)}`,
    ``,
    recipientName ? `**Получатель:** ${escapeInline(recipientName)}` : '',
    ``,
    subject ? `**Тема:** ${escapeInline(subject)}` : '',
    ``,
    `---`,
    ``,
    dialogBlocks || '_Сообщений нет._',
    ``,
    `---`,
    ``,
    `С уважением,`,
    ``,
    escapeInline(lawyerName || '—'),
    ``,
    `_${escapeInline(DEFAULT_LAWYER_POSITION)}_`,
    ``,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n');
}

function renderDialogMessage(message: DBQuestion): string {
  const dt = formatDate(message.created_at as unknown as string);
  const lines: string[] = [];

  // Question text is plain text from the user (no HTML), reply may contain
  // rich-text HTML from the lawyer's editor — strip it before insertion.
  const question = (message.question ?? '').trim();
  if (question) {
    lines.push(`**Вопрос пользователя${dt ? ` (${escapeInline(dt)})` : ''}:**`);
    lines.push('');
    lines.push(escapeBlock(question));
  }

  const reply = stripHtml((message.final_reply ?? '').trim());
  if (reply) {
    if (lines.length) lines.push('');
    const lawyerLabel = message.lawyer?.trim()
      ? `Ответ юриста — ${escapeInline(message.lawyer.trim())}`
      : 'Ответ юриста';
    lines.push(`**${lawyerLabel}:**`);
    lines.push('');
    lines.push(escapeBlock(reply));
  }

  return lines.join('\n');
}
