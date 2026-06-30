import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import logger from '@/src/libs/logger';

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
    prefix: (process.env.S3_ATTACH_PREFIX ?? 'attachments').replace(/^\/+|\/+$/g, ''),
  };
}

function getClient(cfg: S3Config): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: !!cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return cachedClient;
}

export function buildAttachmentKey(
  questionId: number | string,
  uuid: string,
  ext: string,
): string {
  const cfg = readConfig();
  const safeExt = ext.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return `${cfg.prefix}/${questionId}/${uuid}${safeExt ? '.' + safeExt : ''}`;
}

export interface AttachmentObject {
  body: Uint8Array;
  contentType: string;
  contentLength: number;
}

export interface AttachmentPutMetadata {
  questionId: number | string;
  userId: number | string;
  source: string;
}

export async function putAttachmentByKey(
  storageKey: string,
  body: Uint8Array,
  contentType: string,
  metadata: AttachmentPutMetadata,
): Promise<void> {
  const cfg = readConfig();
  const client = getClient(cfg);
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: storageKey,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
      CacheControl: 'private, max-age=0, must-revalidate',
      Metadata: {
        'question-id': String(metadata.questionId),
        'user-id': String(metadata.userId),
        source: metadata.source,
      },
    }),
  );
}

export async function getAttachmentByKey(storageKey: string): Promise<AttachmentObject | null> {
  const cfg = readConfig();
  const client = getClient(cfg);
  let res: GetObjectCommandOutput;
  try {
    res = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: storageKey }));
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404) return null;
    logger.error('attachmentStorage.getAttachmentByKey - get failed', {
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
    contentType: res.ContentType ?? 'application/octet-stream',
    contentLength: body.byteLength,
  };
}

export async function deleteAttachmentByKey(storageKey: string): Promise<void> {
  const cfg = readConfig();
  const client = getClient(cfg);
  try {
    await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: storageKey }));
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e?.$metadata?.httpStatusCode === 404) return;
    logger.error('attachmentStorage.deleteAttachmentByKey - delete failed', {
      storage_key: storageKey,
      name: e?.name,
      status: e?.$metadata?.httpStatusCode,
    });
    throw err;
  }
}
