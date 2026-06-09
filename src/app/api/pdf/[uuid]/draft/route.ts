import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import logger from '@/src/libs/logger';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { generateDraftPdf, getDraftPdf } from '@/src/services/pdf';
import { PDF_ID_REGEX } from '@/src/services/pdf/shortId';

export const dynamic = 'force-dynamic';

function isStaff(role: string | undefined): boolean {
  return role === 'admin' || role === 'lowyer';
}

interface DraftBody {
  replyHtml?: string;
  childId?: number | string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const msg = 'API pdf draft POST - ';
  const { uuid } = await params;
  if (!PDF_ID_REGEX.test(uuid)) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Требуется авторизация.' },
      { status: 401 },
    );
  }
  if (!isStaff(session.user.role)) {
    return NextResponse.json(
      { success: false, message: 'Доступ запрещён.' },
      { status: 403 },
    );
  }

  let body: DraftBody;
  try {
    body = (await request.json()) as DraftBody;
  } catch {
    return NextResponse.json({ success: false, message: 'Некорректный JSON.' }, { status: 400 });
  }
  const replyHtml = typeof body.replyHtml === 'string' ? body.replyHtml : '';
  if (!replyHtml.trim()) {
    return NextResponse.json(
      { success: false, message: 'Пустой ответ — нечего генерировать.' },
      { status: 400 },
    );
  }

  try {
    const pdf = await generateDraftPdf(uuid, {
      replyHtml,
      childId: body.childId ?? null,
    });
    if (!pdf) {
      return NextResponse.json({ success: false, message: 'Вопрос не найден.' }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    logger.error(msg + 'render failed', { uuid, error: (err as Error).message });
    return NextResponse.json(
      { success: false, message: 'Не удалось сформировать PDF. Попробуйте позже.' },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const msg = 'API pdf draft GET - ';
  const { uuid } = await params;
  if (!PDF_ID_REGEX.test(uuid)) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json(
      { success: false, message: 'Доступ запрещён.' },
      { status: 403 },
    );
  }

  try {
    const pdf = await getDraftPdf(uuid);
    if (!pdf) {
      return NextResponse.json(
        { success: false, message: 'Черновик PDF не найден. Сгенерируйте заново.' },
        { status: 404 },
      );
    }
    const body = new Uint8Array(pdf.body);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(pdf.contentLength),
        'Content-Disposition': `inline; filename="enki-draft-${uuid}.pdf"`,
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    logger.error(msg + 'read failed', { uuid, error: (err as Error).message });
    return NextResponse.json(
      { success: false, message: 'Не удалось загрузить PDF.' },
      { status: 500 },
    );
  }
}
