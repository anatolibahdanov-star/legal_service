import { randomUUID } from 'node:crypto';
import logger from '@/src/libs/logger';
import { AttachmentDTO, DBQuestionAttachment } from '@/src/interfaces/db';
import {
  insertQuestionAttachment,
  getAttachmentById,
  deleteAttachmentById,
} from '@/src/repositories/question_attachments/repo';
import {
  buildAttachmentKey,
  putAttachmentByKey,
  deleteAttachmentByKey,
} from '@/src/services/attachments/storage';
import {
  ATTACH_MIME_BY_EXT,
  getExtension,
  validateAttachmentFile,
} from '@/src/app/components/forms/validation/attachments';

export function buildAttachmentDownloadUrl(id: number | string): string {
  return `/api/attachments/file/${id}`;
}

export function toAttachmentDTO(row: DBQuestionAttachment): AttachmentDTO {
  return {
    id: row.id,
    question_id: row.question_id,
    source: row.source,
    filename: row.filename,
    file_size: Number(row.file_size),
    extension: row.extension,
    url: buildAttachmentDownloadUrl(row.id),
  };
}

export interface StoreUploadedFilesInput {
  questionId: number | string;
  userId: number | string;
  source: 'user' | 'lawyer';
  uploadedByAdminId?: number | string | null;
  files: File[];
}

export interface StoreUploadedFilesResult {
  created: AttachmentDTO[];
  error?: string;
}

export async function storeUploadedFiles(
  input: StoreUploadedFilesInput,
): Promise<StoreUploadedFilesResult> {
  const msg = 'services.attachments.storeUploadedFiles - ';
  const created: AttachmentDTO[] = [];
  const committed: Array<{ id: number; storageKey: string }> = [];

  // Best-effort rollback so a mid-batch failure leaves the question with zero
  // new attachments — otherwise the immutability gate (count===0) would block
  // the user from cleanly retrying.
  const rollback = async () => {
    for (const item of committed) {
      await deleteAttachmentByKey(item.storageKey).catch(() => undefined);
      await deleteAttachmentById(item.id).catch(() => undefined);
    }
  };

  for (const file of input.files) {
    const perFile = validateAttachmentFile({ name: file.name, size: file.size, type: file.type });
    if (!perFile.ok) {
      await rollback();
      return { created: [], error: perFile.error };
    }

    const ext = getExtension(file.name);
    const contentType = file.type || ATTACH_MIME_BY_EXT[ext] || 'application/octet-stream';
    const uuid = randomUUID();
    const storageKey = buildAttachmentKey(input.questionId, uuid, ext);
    const bytes = new Uint8Array(await file.arrayBuffer());

    try {
      await putAttachmentByKey(storageKey, bytes, contentType, {
        questionId: input.questionId,
        userId: input.userId,
        source: input.source,
      });
    } catch (err) {
      logger.error(msg + 'S3 put failed', { storage_key: storageKey, error: (err as Error).message });
      await rollback();
      return { created: [], error: 'Не удалось сохранить файл. Попробуйте позже.' };
    }

    const insertedId = await insertQuestionAttachment({
      questionId: input.questionId,
      userId: input.userId,
      source: input.source,
      uploadedByAdminId: input.uploadedByAdminId ?? null,
      filename: file.name,
      storageKey,
      fileSize: file.size,
      extension: ext,
      mime: contentType,
    });

    if (!insertedId) {
      await deleteAttachmentByKey(storageKey).catch(() => undefined);
      await rollback();
      return { created: [], error: 'Не удалось сохранить файл. Попробуйте позже.' };
    }

    committed.push({ id: insertedId, storageKey });
    const row = await getAttachmentById(insertedId);
    if (row) created.push(toAttachmentDTO(row));
  }

  return { created };
}
