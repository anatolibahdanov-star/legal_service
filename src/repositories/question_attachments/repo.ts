import { ResultSetHeader } from 'mysql2/promise';
import {
  find,
  insert,
  remove,
  executeTransactionWrapper,
  queryTransactionWrapper,
} from '@/src/libs/db';
import { DBQuestionAttachment } from '@/src/interfaces/db';
import logger from '@/src/libs/logger';

const msgGlobal = 'repositories.question_attachments.repo - ';

const SELECT_COLUMNS = `id, question_id, user_id, source, uploaded_by_admin_id,
  filename, storage_key, file_size, extension, mime, created_at`;

export interface InsertQuestionAttachmentInput {
  questionId: number | string;
  userId: number | string;
  source: 'user' | 'lawyer';
  uploadedByAdminId?: number | string | null;
  filename: string;
  storageKey: string;
  fileSize: number;
  extension: string;
  mime?: string | null;
}

export async function insertQuestionAttachment(
  input: InsertQuestionAttachmentInput,
): Promise<number | null> {
  const msg = msgGlobal + 'insertQuestionAttachment - ';
  const query = `INSERT INTO question_attachment
    (question_id, user_id, source, uploaded_by_admin_id, filename, storage_key, file_size, extension, mime)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    input.questionId,
    input.userId,
    input.source,
    input.uploadedByAdminId ?? null,
    input.filename,
    input.storageKey,
    input.fileSize,
    input.extension,
    input.mime ?? null,
  ];
  const insertFunc = insert({ query, values: params });
  const executed = await executeTransactionWrapper<ResultSetHeader>([insertFunc], msg);
  if (!executed) {
    logger.error(msg + 'insert failed', { question_id: input.questionId });
    return null;
  }
  const [result] = executed;
  return result[0]?.insertId ?? null;
}

export async function getAttachmentsByQuestionId(
  questionId: number | string,
  source?: 'user' | 'lawyer',
): Promise<DBQuestionAttachment[]> {
  const msg = msgGlobal + 'getAttachmentsByQuestionId - ';
  let query = `SELECT ${SELECT_COLUMNS} FROM question_attachment WHERE question_id=?`;
  const values: Array<number | string> = [questionId];
  if (source) {
    query += ' AND source=?';
    values.push(source);
  }
  query += ' ORDER BY id ASC';
  const findFunc = find({ query, values });
  const executed = await queryTransactionWrapper<DBQuestionAttachment>([findFunc], msg);
  if (!executed) {
    logger.error(msg + 'no results from execution', { question_id: questionId });
    return [];
  }
  const [[rows]] = executed;
  return rows as DBQuestionAttachment[];
}

export async function getAttachmentsByQuestionIds(
  ids: Array<number | string>,
  source?: 'user' | 'lawyer',
): Promise<DBQuestionAttachment[]> {
  const msg = msgGlobal + 'getAttachmentsByQuestionIds - ';
  if (!ids.length) return [];
  let query = `SELECT ${SELECT_COLUMNS} FROM question_attachment WHERE question_id IN (?)`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values: any[] = [ids];
  if (source) {
    query += ' AND source=?';
    values.push(source);
  }
  query += ' ORDER BY id ASC';
  const findFunc = find({ query, values });
  const executed = await queryTransactionWrapper<DBQuestionAttachment>([findFunc], msg);
  if (!executed) {
    logger.error(msg + 'no results from execution', { ids });
    return [];
  }
  const [[rows]] = executed;
  return rows as DBQuestionAttachment[];
}

export async function getAttachmentById(
  id: number | string,
): Promise<DBQuestionAttachment | null> {
  const msg = msgGlobal + 'getAttachmentById - ';
  const query = `SELECT ${SELECT_COLUMNS} FROM question_attachment WHERE id=? LIMIT 1`;
  const findFunc = find({ query, values: [id] });
  const executed = await queryTransactionWrapper<DBQuestionAttachment>([findFunc], msg);
  if (!executed) return null;
  const [[rows]] = executed;
  return rows.length === 0 ? null : (rows[0] as DBQuestionAttachment);
}

export async function countByQuestionId(
  questionId: number | string,
  source?: 'user' | 'lawyer',
): Promise<number> {
  const msg = msgGlobal + 'countByQuestionId - ';
  let query = `SELECT COUNT(id) AS counter FROM question_attachment WHERE question_id=?`;
  const values: Array<number | string> = [questionId];
  if (source) {
    query += ' AND source=?';
    values.push(source);
  }
  const findFunc = find({ query, values });
  const executed = await queryTransactionWrapper([findFunc], msg);
  if (!executed) return 0;
  const [[rows]] = executed;
  return rows.length === 0 ? 0 : Number((rows[0] as { counter: number }).counter);
}

export async function deleteAttachmentById(id: number | string): Promise<boolean> {
  const msg = msgGlobal + 'deleteAttachmentById - ';
  const query = `DELETE FROM question_attachment WHERE id=?`;
  const removeFunc = remove({ query, values: [id] });
  const executed = await executeTransactionWrapper<ResultSetHeader>([removeFunc], msg);
  if (!executed) return false;
  const [result] = executed;
  return (result[0]?.affectedRows ?? 0) > 0;
}
