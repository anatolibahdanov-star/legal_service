import { ResultSetHeader } from 'mysql2/promise';
import {
  find,
  insert,
  remove,
  executeTransactionWrapper,
  queryTransactionWrapper,
} from '@/src/libs/db';
import { DBQuestionPdf } from '@/src/interfaces/db';
import logger from '@/src/libs/logger';

const msgGlobal = 'repositories.question_pdfs.repo - ';

export async function getQuestionPdfByQuestionId(
  questionId: number | string,
): Promise<DBQuestionPdf | null> {
  const msg = msgGlobal + 'getQuestionPdfByQuestionId - ';
  const query = `SELECT id, question_id, user_id, storage_key, file_size,
    content_hash, generated_at, updated_at
    FROM question_pdf WHERE question_id=?`;
  const findFunc = find({ query, values: [questionId] });
  const executed = await queryTransactionWrapper<DBQuestionPdf>([findFunc], msg);
  if (!executed) {
    logger.error(msg + 'no results from execution', { question_id: questionId });
    return null;
  }
  const [[rows]] = executed;
  return rows.length === 0 ? null : (rows[0] as DBQuestionPdf);
}

export interface UpsertQuestionPdfInput {
  questionId: number;
  userId: number;
  storageKey: string;
  fileSize: number;
  contentHash: string;
}

/**
 * Inserts a new question_pdf row or updates the existing one for this question.
 * Uniqueness is enforced by UNIQUE KEY on (question_id) — we rely on
 * `ON DUPLICATE KEY UPDATE` for atomic upsert semantics.
 */
export async function upsertQuestionPdf(
  input: UpsertQuestionPdfInput,
): Promise<DBQuestionPdf | null> {
  const msg = msgGlobal + 'upsertQuestionPdf - ';
  const query = `INSERT INTO question_pdf
    (question_id, user_id, storage_key, file_size, content_hash)
    VALUES(?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      user_id=VALUES(user_id),
      storage_key=VALUES(storage_key),
      file_size=VALUES(file_size),
      content_hash=VALUES(content_hash),
      updated_at=CURRENT_TIMESTAMP`;
  const params = [
    input.questionId,
    input.userId,
    input.storageKey,
    input.fileSize,
    input.contentHash,
  ];
  const insertFunc = insert({ query, values: params });
  const executed = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
  if (!executed) {
    logger.error(msg + 'upsert failed', { question_id: input.questionId });
    return null;
  }
  return getQuestionPdfByQuestionId(input.questionId);
}

export async function deleteQuestionPdfByQuestionId(
  questionId: number | string,
): Promise<boolean> {
  const msg = msgGlobal + 'deleteQuestionPdfByQuestionId - ';
  const query = `DELETE FROM question_pdf WHERE question_id=?`;
  const removeFunc = remove({ query, values: [questionId] });
  const executed = await executeTransactionWrapper<ResultSetHeader>([removeFunc], msg);
  if (!executed) {
    logger.error(msg + 'delete failed', { question_id: questionId });
    return false;
  }
  const [result] = executed;
  return (result[0]?.affectedRows ?? 0) > 0;
}
