import path from 'path';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import { getJobById, getQuestionByShortId, getQuestionsByIds } from '@/src/repositories/requests/repo';
import { isShortId } from '@/src/services/pdf/shortId';
import {
  getQuestionPdfByQuestionId,
  upsertQuestionPdf,
  deleteQuestionPdfByQuestionId,
} from '@/src/repositories/question_pdfs/repo';
import { DBQuestion, DBQuestionPdf } from '@/src/interfaces/db';
import logger from '@/src/libs/logger';
import { buildQuarkdownSource } from './template';
import { renderQuarkdownToPdf } from './render';
import {
  buildStorageKey,
  buildDraftStorageKey,
  deletePdfByKey,
  getPdfByKey,
  pdfExistsByKey,
  putPdfByKey,
  type PdfObject,
} from './storage';

const LOGO_PUBLIC_PATH = 'public/site/pdflogo.png';

// Coalesce concurrent generation requests for the same question into a single
// Quarkdown invocation — multiple users hitting "preview"+"download" at once
// would otherwise produce duplicate work and racey S3 writes.
const inflight = new Map<number, Promise<PdfResult>>();

export interface PdfResult {
  pdf: PdfObject;
  /** True when this call generated the file; false when it came from cache. */
  generated: boolean;
  /** DB-tracked binding (user_id + question_id + storage_key). */
  binding: {
    questionId: number;
    userId: number;
    storageKey: string;
    contentHash: string;
  };
}

export class PdfNotFoundError extends Error {
  readonly code = 'PDF_NOT_FOUND';
}

/**
 * Returns the PDF for a question identified by its full uuid OR its 4-char
 * short_id. Internally we always pivot to the canonical question.uuid so the
 * S3 storage key is stable regardless of which alias the caller used.
 *
 *  1. Resolve id → question (loads root + user_id).
 *  2. Look up `question_pdf` row in DB.
 *  3. If row exists → fetch S3 by `storage_key`.
 *     - hit  → return as cache hit.
 *     - miss → log warning, delete orphan DB row, fall through to generate.
 *  4. Otherwise → render via Quarkdown, write to S3 (with metadata), upsert DB.
 *
 * All steps log to winston. Concurrent generation for the same question
 * coalesces through an in-process inflight map.
 */
export async function getOrGeneratePdf(id: string): Promise<PdfResult | null> {
  const msg = 'pdfService.getOrGeneratePdf - ';

  const loaded = await loadThread(id);
  if (!loaded) {
    logger.info(msg + 'question not found', { id });
    return null;
  }
  const { root, thread } = loaded;
  const questionId = Number(root.id);
  const userId = Number(root.user_id);
  const canonicalUuid = root.uuid;

  // --- Cache path ---
  const cached = await readFromCache(questionId, canonicalUuid);
  if (cached) {
    logger.info(msg + 'cache hit', {
      uuid: canonicalUuid,
      question_id: questionId,
      user_id: userId,
      storage_key: cached.binding.storageKey,
      bytes: cached.pdf.contentLength,
    });
    return cached;
  }

  // --- Generation path ---
  const existing = inflight.get(questionId);
  if (existing) {
    const result = await existing;
    return { ...result, generated: false };
  }

  const work = generateAndStore({ uuid: canonicalUuid, root, thread, questionId, userId });
  inflight.set(questionId, work);
  try {
    const result = await work;
    return result;
  } finally {
    inflight.delete(questionId);
  }
}

interface GenerateArgs {
  uuid: string;
  root: DBQuestion;
  thread: DBQuestion[];
  questionId: number;
  userId: number;
}

async function generateAndStore(args: GenerateArgs): Promise<PdfResult> {
  const msg = 'pdfService.generateAndStore - ';
  const { uuid, root, thread, questionId, userId } = args;

  const logoPath = path.join(process.cwd(), LOGO_PUBLIC_PATH);
  await assertFileExists(logoPath);

  const source = buildQuarkdownSource({ root, thread, logoPath });
  const contentHash = sha256(source);
  const storageKey = buildStorageKey(questionId, uuid);

  let pdf: Uint8Array;
  try {
    const res = await renderQuarkdownToPdf({ source, jobId: uuid });
    pdf = res.pdf;
  } catch (err) {
    logger.error(msg + 'quarkdown render failed', {
      uuid,
      question_id: questionId,
      error: (err as Error).message,
    });
    throw err;
  }

  try {
    await putPdfByKey(storageKey, pdf, { userId, questionId, contentHash });
  } catch (err) {
    logger.error(msg + 'S3 put failed', {
      uuid,
      question_id: questionId,
      storage_key: storageKey,
      error: (err as Error).message,
    });
    throw err;
  }

  try {
    await upsertQuestionPdf({
      questionId,
      userId,
      storageKey,
      fileSize: pdf.byteLength,
      contentHash,
    });
  } catch (err) {
    // S3 write succeeded but DB upsert failed — log as warning. Next request
    // will treat the S3 object as orphan and regenerate, which is acceptable.
    logger.warn(msg + 'DB upsert failed after S3 put', {
      uuid,
      question_id: questionId,
      error: (err as Error).message,
    });
  }

  logger.info(msg + 'generated and cached', {
    uuid,
    question_id: questionId,
    user_id: userId,
    storage_key: storageKey,
    bytes: pdf.byteLength,
    content_hash: contentHash,
  });

  return {
    pdf: {
      body: pdf,
      contentType: 'application/pdf',
      contentLength: pdf.byteLength,
      metadata: {
        'user-id': String(userId),
        'question-id': String(questionId),
        'content-hash': contentHash,
      },
    },
    generated: true,
    binding: { questionId, userId, storageKey, contentHash },
  };
}

/**
 * Fast existence check used by the UI to pick the right loader label
 * ("Загружаем…" if PDF exists, "Генерируем…" if not). Touches only the DB —
 * no S3 round-trip — so it stays in the millisecond range.
 *
 * Accepts either the full uuid or the 4-char short_id.
 */
export async function hasCachedPdf(id: string): Promise<boolean> {
  try {
    const root = isShortId(id)
      ? await getQuestionByShortId(id)
      : await (async () => {
          const rows = await getQuestionsByIds([id], false);
          return rows?.[0] ?? null;
        })();
    if (!root) return false;
    const row = await getQuestionPdfByQuestionId(Number(root.id));
    return !!row;
  } catch (err) {
    logger.error('pdfService.hasCachedPdf - error', {
      id,
      error: (err as Error).message,
    });
    return false;
  }
}

/**
 * Fire-and-forget cache warming. If the PDF isn't already in storage, kicks
 * off generation in the background so a recipient of a freshly-shared link
 * doesn't see a cold-start delay. Toggleable via `PDF_PREGENERATE_ON_SHARE=0`
 * for cost-sensitive deployments.
 *
 * Errors are logged, never thrown — call sites can ignore the return.
 */
export function triggerBackgroundGeneration(id: string): void {
  if (process.env.PDF_PREGENERATE_ON_SHARE === '0') return;
  void (async () => {
    try {
      if (await hasCachedPdf(id)) return;
      await getOrGeneratePdf(id);
    } catch (err) {
      logger.warn('pdfService.triggerBackgroundGeneration - failed', {
        id,
        error: (err as Error).message,
      });
    }
  })();
}

/**
 * Invalidates the cached PDF for a question. Call this when the underlying
 * data changes (e.g. lawyer edits `final_reply`). The next request will
 * regenerate from scratch.
 */
export async function invalidatePdfCache(questionId: number | string): Promise<void> {
  const msg = 'pdfService.invalidatePdfCache - ';
  try {
    const row = await getQuestionPdfByQuestionId(questionId);
    if (!row) return;
    await deletePdfByKey(row.storage_key).catch((err) => {
      // Don't block DB cleanup on S3 failure — the DB row is the source of truth.
      logger.warn(msg + 'S3 delete failed, continuing with DB cleanup', {
        question_id: questionId,
        storage_key: row.storage_key,
        error: (err as Error).message,
      });
    });
    await deleteQuestionPdfByQuestionId(questionId);
    logger.info(msg + 'invalidated', {
      question_id: questionId,
      storage_key: row.storage_key,
    });
  } catch (err) {
    logger.error(msg + 'failed', {
      question_id: questionId,
      error: (err as Error).message,
    });
  }
}

export interface DraftPdfInput {
  replyHtml: string;
  childId?: number | string | null;
}

export async function generateDraftPdf(
  id: string,
  input: DraftPdfInput,
): Promise<PdfObject | null> {
  const msg = 'pdfService.generateDraftPdf - ';

  const loaded = await loadThread(id);
  if (!loaded) {
    logger.info(msg + 'question not found', { id });
    return null;
  }
  const { root, thread } = loaded;
  const questionId = Number(root.id);
  const userId = Number(root.user_id);

  const patchedThread = spliceDraftReply(thread, input);

  const logoPath = path.join(process.cwd(), LOGO_PUBLIC_PATH);
  await assertFileExists(logoPath);

  const source = buildQuarkdownSource({ root, thread: patchedThread, logoPath });
  const contentHash = sha256(source);
  const storageKey = buildDraftStorageKey(questionId);

  let pdf: Uint8Array;
  try {
    const res = await renderQuarkdownToPdf({ source, jobId: `draft-${root.uuid}` });
    pdf = res.pdf;
  } catch (err) {
    logger.error(msg + 'quarkdown render failed', {
      uuid: root.uuid,
      question_id: questionId,
      error: (err as Error).message,
    });
    throw err;
  }

  await putPdfByKey(storageKey, pdf, { userId, questionId, contentHash });

  logger.info(msg + 'generated', {
    uuid: root.uuid,
    question_id: questionId,
    user_id: userId,
    storage_key: storageKey,
    bytes: pdf.byteLength,
    content_hash: contentHash,
  });

  return {
    body: pdf,
    contentType: 'application/pdf',
    contentLength: pdf.byteLength,
    metadata: {
      'user-id': String(userId),
      'question-id': String(questionId),
      'content-hash': contentHash,
    },
  };
}

export async function getDraftPdf(id: string): Promise<PdfObject | null> {
  const loaded = await loadThread(id);
  if (!loaded) return null;
  return getPdfByKey(buildDraftStorageKey(Number(loaded.root.id)));
}

export async function deleteDraftPdf(questionId: number | string): Promise<void> {
  try {
    await deletePdfByKey(buildDraftStorageKey(questionId));
  } catch (err) {
    logger.warn('pdfService.deleteDraftPdf - S3 delete failed', {
      question_id: questionId,
      error: (err as Error).message,
    });
  }
}

export async function regenerateCanonicalPdf(rootQuestionId: number | string): Promise<void> {
  const msg = 'pdfService.regenerateCanonicalPdf - ';
  try {
    const rows = await getQuestionsByIds([String(rootQuestionId)], true);
    const root = rows?.[0];
    if (!root?.uuid) {
      logger.warn(msg + 'root question not found', { root_question_id: rootQuestionId });
      return;
    }
    await getOrGeneratePdf(root.uuid);
    logger.info(msg + 'regenerated', { root_question_id: rootQuestionId, uuid: root.uuid });
  } catch (err) {
    logger.warn(msg + 'failed', {
      root_question_id: rootQuestionId,
      error: (err as Error).message,
    });
  }
}

function spliceDraftReply(thread: DBQuestion[], input: DraftPdfInput): DBQuestion[] {
  if (thread.length === 0) return thread;
  const targetId = input.childId != null ? String(input.childId) : null;
  let targetIdx =
    targetId != null ? thread.findIndex((m) => String(m.id) === targetId) : -1;
  if (targetIdx < 0) targetIdx = thread.length - 1;
  return thread.map((m, i) =>
    i === targetIdx ? { ...m, final_reply: input.replyHtml } : m,
  );
}

async function readFromCache(
  questionId: number,
  uuid: string,
): Promise<PdfResult | null> {
  const msg = 'pdfService.readFromCache - ';
  const row = await getQuestionPdfByQuestionId(questionId);
  if (!row) return null;

  let s3Object: PdfObject | null;
  try {
    s3Object = await getPdfByKey(row.storage_key);
  } catch (err) {
    logger.error(msg + 'S3 read failed', {
      uuid,
      question_id: questionId,
      storage_key: row.storage_key,
      error: (err as Error).message,
    });
    // S3 transient failure — treat as cache miss but don't drop the DB row
    // (file likely still exists, next request will retry).
    return null;
  }

  if (!s3Object) {
    // DB says it exists, S3 says it doesn't — orphan row. Drop and regenerate.
    logger.warn(msg + 'orphan DB row, dropping', {
      uuid,
      question_id: questionId,
      storage_key: row.storage_key,
    });
    await deleteQuestionPdfByQuestionId(questionId).catch((err) => {
      logger.warn(msg + 'orphan cleanup failed', {
        question_id: questionId,
        error: (err as Error).message,
      });
    });
    return null;
  }

  return {
    pdf: s3Object,
    generated: false,
    binding: bindingFromRow(row),
  };
}

function bindingFromRow(row: DBQuestionPdf): PdfResult['binding'] {
  return {
    questionId: row.question_id,
    userId: row.user_id,
    storageKey: row.storage_key,
    contentHash: row.content_hash,
  };
}

async function assertFileExists(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`Required asset missing on disk: ${filePath}`);
  }
}

interface LoadedThread {
  root: DBQuestion;
  thread: DBQuestion[];
}

async function loadThread(id: string): Promise<LoadedThread | null> {
  // Accept either a 4-char public short_id or a full UUID. The route layer
  // has already validated the format, so a value that matches neither lookup
  // returns null (same as "not found").
  const root = isShortId(id)
    ? await getQuestionByShortId(id)
    : await (async () => {
        const rows = await getQuestionsByIds([id], false);
        return rows && rows.length > 0 ? rows[0] : null;
      })();
  if (!root) return null;
  const thread = await getJobById(Number(root.id));
  return { root, thread: thread ?? [root] };
}

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

// Keep storage primitives accessible for the existence-check endpoint that
// doesn't want to spin up the full service path.
export { pdfExistsByKey, getPdfByKey };
