import { NextRequest, NextResponse } from 'next/server';
import logger from '@/src/libs/logger';
import { sendSmsTemplate } from '@/src/libs/p1sms';
import { SmsTemplateE } from '@/src/interfaces/sms';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const msg = 'API CHECK SMS GET - ';
  const expectedSecret = process.env.P1SMS_TEST_SECRET;
  const providedSecret = request.headers.get('x-test-secret');

  if (!expectedSecret || providedSecret !== expectedSecret) {
    logger.warn(msg + 'unauthorized');
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  const phone = request.nextUrl.searchParams.get('phone');
  const text = request.nextUrl.searchParams.get('text');
  const template = request.nextUrl.searchParams.get('template');
  const code = request.nextUrl.searchParams.get('code');

  if (!phone) {
    return NextResponse.json(
      { success: false, message: 'phone is required' },
      { status: 400 },
    );
  }

  logger.info(msg + 'request', {
    phone_len: phone.length,
    template,
    has_text: !!text,
    has_code: !!code,
  });

  let result;
  if (template === SmsTemplateE.OtpCode) {
    result = await sendSmsTemplate({
      phone,
      template: SmsTemplateE.OtpCode,
      params: { code: code ?? '0000' },
    });
  } else if (template === SmsTemplateE.ApprovedTest) {
    result = await sendSmsTemplate({
      phone,
      template: SmsTemplateE.ApprovedTest,
    });
  } else if (template === SmsTemplateE.ServiceTest) {
    result = await sendSmsTemplate({
      phone,
      template: SmsTemplateE.ServiceTest,
    });
  } else {
    result = await sendSmsTemplate({
      phone,
      template: SmsTemplateE.Test,
      params: { text: text ?? 'check' },
    });
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
