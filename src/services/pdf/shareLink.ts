import { getOrCreateShareLink } from '@/src/repositories/pdf_share_links/repo';
import logger from '@/src/libs/logger';

function baseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_URL ?? process.env.NEXTAUTH_URL ?? '';
  return raw.replace(/\/+$/, '');
}

export function buildShareUrl(questionId: number | string, token: string): string {
  return `${baseUrl()}/api/pdf/share/${questionId}/${token}`;
}

/**
 * Returns the existing share URL for the question, minting a fresh token if
 * none exists. Caller must have already verified the user owns the question.
 *
 * Returns null only on DB failure — the caller can decide whether to retry or
 * surface as a 500.
 */
export async function getOrCreateShareUrl(
  questionId: number,
  userId: number,
): Promise<string | null> {
  const link = await getOrCreateShareLink(questionId, userId);
  if (!link) {
    logger.error('pdfShareLink.getOrCreateShareUrl - mint failed', {
      question_id: questionId,
      user_id: userId,
    });
    return null;
  }
  return buildShareUrl(link.question_id, link.token);
}
