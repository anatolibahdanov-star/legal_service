import { randomBytes } from 'crypto';
import { ResultSetHeader } from 'mysql2/promise';
import {
  find,
  insert,
  executeTransactionWrapper,
  queryTransactionWrapper,
} from '@/src/libs/db';
import { DBPdfShareLink } from '@/src/interfaces/db';
import logger from '@/src/libs/logger';

const msgGlobal = 'repositories.pdf_share_links.repo - ';

function newToken(): string {
  return randomBytes(32).toString('hex');
}

export async function getShareLinkByQuestionId(
  questionId: number | string,
): Promise<DBPdfShareLink | null> {
  const msg = msgGlobal + 'getShareLinkByQuestionId - ';
  const query = `SELECT id, question_id, user_id, token, revoked, created_at, updated_at
    FROM pdf_share_link WHERE question_id=?`;
  const findFunc = find({ query, values: [questionId] });
  const executed = await queryTransactionWrapper<DBPdfShareLink>([findFunc], msg);
  if (!executed) {
    logger.error(msg + 'no results from execution', { question_id: questionId });
    return null;
  }
  const [[rows]] = executed;
  return rows.length === 0 ? null : (rows[0] as DBPdfShareLink);
}

export async function getShareLinkByToken(
  token: string,
): Promise<DBPdfShareLink | null> {
  const msg = msgGlobal + 'getShareLinkByToken - ';
  const query = `SELECT id, question_id, user_id, token, revoked, created_at, updated_at
    FROM pdf_share_link WHERE token=? AND revoked=0`;
  const findFunc = find({ query, values: [token] });
  const executed = await queryTransactionWrapper<DBPdfShareLink>([findFunc], msg);
  if (!executed) {
    logger.error(msg + 'no results from execution');
    return null;
  }
  const [[rows]] = executed;
  return rows.length === 0 ? null : (rows[0] as DBPdfShareLink);
}

/**
 * Returns the existing share link for the question, or creates a new one with
 * a fresh cryptographically random token. Atomic via `ON DUPLICATE KEY UPDATE`
 * — concurrent calls converge on the same row without producing duplicate
 * tokens for the same question.
 */
export async function getOrCreateShareLink(
  questionId: number,
  userId: number,
): Promise<DBPdfShareLink | null> {
  const msg = msgGlobal + 'getOrCreateShareLink - ';

  const existing = await getShareLinkByQuestionId(questionId);
  if (existing && !existing.revoked) return existing;

  const token = newToken();
  // If a revoked row exists, ON DUPLICATE KEY UPDATE re-activates it with a
  // fresh token. If no row exists, we insert. Either way, exactly one row per
  // question_id after this call.
  const query = `INSERT INTO pdf_share_link (question_id, user_id, token, revoked)
    VALUES (?, ?, ?, 0)
    ON DUPLICATE KEY UPDATE
      token=VALUES(token),
      revoked=0,
      user_id=VALUES(user_id),
      updated_at=CURRENT_TIMESTAMP`;
  const insertFunc = insert({ query, values: [questionId, userId, token] });
  const executed = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
  if (!executed) {
    logger.error(msg + 'upsert failed', { question_id: questionId });
    return null;
  }
  return getShareLinkByQuestionId(questionId);
}
