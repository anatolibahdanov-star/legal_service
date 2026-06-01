// The reply starts with an internal "АНАЛИЗ ЗАПРОСА" section (analysis for the
// lawyer/admin) followed by the client-facing "ОТВЕТ КЛИЕНТУ" section. The
// analysis must never reach the client.
const ANALYSIS_SECTION_RE = /АНАЛИЗ ЗАПРОСА:?[\s\S]*?(?=ОТВЕТ КЛИЕНТУ:)/i;

// Grok wraps any text it added/rewrote in double curly braces ({{...}}) per the
// prompt's "ПРАВИЛО СКОБОК".
const EDIT_MARK_RE = /\{\{([\s\S]*?)\}\}/g;

/**
 * Removes the internal "АНАЛИЗ ЗАПРОСА" section, keeping everything from
 * "ОТВЕТ КЛИЕНТУ" onward. If the reply has no "ОТВЕТ КЛИЕНТУ" anchor the text is
 * returned unchanged (safer than risking dropping the whole answer).
 */
export function stripAnalysisSection(text: string): string {
  if (!text) return text;
  return text.replace(ANALYSIS_SECTION_RE, '').replace(/^\s+/, '');
}

/** Strips the {{...}} edit-markup braces, keeping the inner text. */
export function stripEditMarks(text: string): string {
  if (!text) return text;
  return text.replace(EDIT_MARK_RE, (_, inner) => inner);
}

/** Wraps each {{...}} fragment (braces included) in an inline red <span>. */
export function highlightEditMarks(html: string): string {
  if (!html) return html;
  return html.replace(EDIT_MARK_RE, (match) =>
    `<span style="background-color:#fee2e2;color:#b91c1c;padding:0 2px;border-radius:2px">${match}</span>`);
}

/** Client-facing reply: drop the analysis section and the {{ }} edit braces. */
export function toClientReply(text: string): string {
  return stripEditMarks(stripAnalysisSection(text));
}
