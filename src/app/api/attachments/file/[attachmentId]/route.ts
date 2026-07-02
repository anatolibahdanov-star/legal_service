import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getQuestionsByIds } from '@/src/repositories/requests/repo';
import {
  getAttachmentById,
  deleteAttachmentById,
} from '@/src/repositories/question_attachments/repo';
import {
  getAttachmentByKey,
  deleteAttachmentByKey,
} from '@/src/services/attachments/storage';
import { ATTACH_MIME_BY_EXT } from '@/src/app/components/forms/validation/attachments';
import logger from '@/src/libs/logger';

export const dynamic = 'force-dynamic';

function isStaff(role: string | undefined): boolean {
  return role === 'admin' || role === 'lowyer';
}

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, "'");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const msg = 'API ATTACHMENT DOWNLOAD - ';
  const { attachmentId } = await params;

  const attachment = await getAttachmentById(attachmentId);
  if (!attachment) {
    return NextResponse.json({ success: false, message: 'Файл не найден.' }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const staff = isStaff(session?.user?.role);

  let allowed = staff;
  if (!allowed && session?.user?.id) {
    const questions = await getQuestionsByIds([attachment.question_id.toString()]);
    const owner = questions && questions.length > 0 ? questions[0].user_id : null;
    allowed = owner != null && owner.toString() === session.user.id.toString();
  }
  if (!allowed) {
    return NextResponse.json({ success: false, message: 'Доступ запрещён.' }, { status: 403 });
  }

  try {
    const obj = await getAttachmentByKey(attachment.storage_key);
    if (!obj) {
      return NextResponse.json({ success: false, message: 'Файл не найден.' }, { status: 404 });
    }
    const body = new Uint8Array(obj.body);
    return new NextResponse(body, {
      status: 200,
      headers: {
        // Derive from the validated extension, not the client-supplied mime.
        'Content-Type': ATTACH_MIME_BY_EXT[attachment.extension] || 'application/octet-stream',
        'Content-Length': String(obj.contentLength),
        'Content-Disposition': contentDisposition(attachment.filename),
        'Cache-Control': 'private, max-age=0, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    logger.error(msg + 'stream failed', { attachmentId, error: (err as Error).message });
    return NextResponse.json({ success: false, message: 'Не удалось получить файл.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const msg = 'API ATTACHMENT DELETE - ';
  const { attachmentId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, message: 'Доступ запрещён.' }, { status: 403 });
  }

  const attachment = await getAttachmentById(attachmentId);
  if (!attachment) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  await deleteAttachmentByKey(attachment.storage_key).catch((err) =>
    logger.error(msg + 'S3 delete failed', { attachmentId, error: (err as Error).message }),
  );
  const removed = await deleteAttachmentById(attachmentId);
  return NextResponse.json({ success: removed }, { status: 200 });
}
