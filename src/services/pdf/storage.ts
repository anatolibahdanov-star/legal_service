import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import logger from '@/src/libs/logger';

// Lazily-instantiated client so the app still boots when S3 env vars are missing
// — failure surfaces only when generating/serving a PDF, with a clear message.
let cachedClient: S3Client | null = null;

interface S3Config {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix: string;
}

function readConfig(): S3Config {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3 storage is not configured. Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.',
    );
  }
  return {
    bucket,
    region,
    endpoint: process.env.S3_ENDPOINT || undefined,
    accessKeyId,
    secretAccessKey,
    prefix: (process.env.S3_PDF_PREFIX ?? 'pdfs').replace(/^\/+|\/+$/g, ''),
  };
}

function getClient(cfg: S3Config): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    // S3-compatible providers (Yandex Object Storage, MinIO) require path-style.
    forcePathStyle: !!cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return cachedClient;
}

/** Storage key format: `${prefix}/<question_id>/<uuid>.pdf` — partitioned by
 *  question for easier per-question cleanup; the uuid suffix keeps the URL
 *  unguessable. */
export function buildStorageKey(questionId: number | string, uuid: string): string {
  const cfg = readConfig();
  return `${cfg.prefix}/${questionId}/${uuid}.pdf`;
}

export function buildDraftStorageKey(questionId: number | string): string {
  const cfg = readConfig();
  return `${cfg.prefix}/${questionId}/draft.pdf`;
}

export interface PdfObject {
  body: Uint8Array;
  contentType: string;
  contentLength: number;
  metadata?: Record<string, string>;
}

export interface PdfMetadata {
  userId: number | string;
  questionId: number | string;
  contentHash: string;
}

export async function pdfExistsByKey(storageKey: string): Promise<boolean> {
  const cfg = readConfig();
  const client = getClient(cfg);
  try {
    await client.send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: storageKey }));
    return true;
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404) return false;
    logger.error('pdfStorage.pdfExistsByKey - unexpected error', {
      storage_key: storageKey,
      name: e?.name,
      status: e?.$metadata?.httpStatusCode,
    });
    throw err;
  }
}

export async function getPdfByKey(storageKey: string): Promise<PdfObject | null> {
  const cfg = readConfig();
  const client = getClient(cfg);
  let res: GetObjectCommandOutput;
  try {
    res = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: storageKey }));
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404) return null;
    logger.error('pdfStorage.getPdfByKey - get failed', {
      storage_key: storageKey,
      name: e?.name,
      status: e?.$metadata?.httpStatusCode,
    });
    throw err;
  }
  if (!res.Body) return null;
  const body = await res.Body.transformToByteArray();
  return {
    body,
    contentType: res.ContentType ?? 'application/pdf',
    contentLength: body.byteLength,
    metadata: res.Metadata,
  };
}

export async function putPdfByKey(
  storageKey: string,
  body: Uint8Array,
  metadata: PdfMetadata,
): Promise<void> {
  const cfg = readConfig();
  const client = getClient(cfg);
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: storageKey,
      Body: body,
      ContentType: 'application/pdf',
      // Cache for a year — the storage_key embeds question_id; regeneration
      // replaces the same key in place, so any cached copy is acceptable until
      // explicitly invalidated via DB delete.
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        // S3 metadata keys are lower-cased on the wire. Stick to ASCII.
        'user-id': String(metadata.userId),
        'question-id': String(metadata.questionId),
        'content-hash': metadata.contentHash,
      },
    }),
  );
}

export async function deletePdfByKey(storageKey: string): Promise<void> {
  const cfg = readConfig();
  const client = getClient(cfg);
  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: cfg.bucket, Key: storageKey }),
    );
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    // 404 on delete is fine — already gone.
    if (e?.$metadata?.httpStatusCode === 404) return;
    logger.error('pdfStorage.deletePdfByKey - delete failed', {
      storage_key: storageKey,
      name: e?.name,
      status: e?.$metadata?.httpStatusCode,
    });
    throw err;
  }
}
