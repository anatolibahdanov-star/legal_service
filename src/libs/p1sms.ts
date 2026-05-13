import { parsePhoneNumberFromString } from 'libphonenumber-js';
import logger from '@/src/libs/logger';
import {
  SmsTemplateE,
  SmsSendRawDataI,
  SmsSendTemplateDataI,
  SmsSendResultI,
} from '@/src/interfaces/sms';

const GENERIC_USER_ERROR = 'Не удалось отправить SMS. Попробуйте позже.';
const DEFAULT_API_URL = 'https://admin.p1sms.ru';

type Channel = 'digit' | 'char' | 'viber' | 'vk' | 'telegram';
const CHANNELS_REQUIRING_SENDER: Channel[] = ['char', 'viber'];

const templates: Record<SmsTemplateE, (params: Record<string, string>) => string> = {
  [SmsTemplateE.Test]: ({ text = 'Hello' }) => `Enki.legal: ${text}`,
  [SmsTemplateE.OtpCode]: ({ code }) =>
    `Enki.legal: код подтверждения ${code}. Никому не сообщайте.`,
  [SmsTemplateE.ApprovedTest]: () => `Enki.legal: тестовый шаблон для юридической компании`,
  [SmsTemplateE.ServiceTest]: () => `Enki.legal: тест сервиса`,
};

export const renderSmsTemplate = (
  template: SmsTemplateE,
  params: Record<string, string> = {},
): string => templates[template](params);

export const normalizePhone = (raw: string): string | null => {
  const trimmed = raw.trim();
  let parsed = parsePhoneNumberFromString(trimmed, 'RU');
  if (parsed?.isValid()) return parsed.number.replace(/^\+/, '');

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) {
    parsed = parsePhoneNumberFromString(`+${digits}`);
    if (parsed?.isValid()) return parsed.number.replace(/^\+/, '');
  }
  return null;
};

export const maskPhone = (digits: string): string => {
  if (digits.length < 5) return '***';
  return `${digits.slice(0, 2)}***${digits.slice(-2)}`;
};

interface ProviderSmsItem {
  id?: number | string;
  status?: string;
  phone?: string;
  message?: string;
  error?: string;
  errorCode?: number;
}

interface ProviderSmsResponse {
  status?: string;
  data?: ProviderSmsItem[];
  error?: string;
  errors?: unknown;
}

export const isDryRun = (): boolean => {
  const flag = process.env.P1SMS_DRY_RUN;
  if (flag === undefined) return true;
  return flag.toLowerCase() !== 'false';
};

const SMS_SEGMENT_GSM = 160;
const SMS_SEGMENT_UCS2 = 70;

// 3GPP TS 23.038 — GSM-7 default alphabet + extension table.
// If every text character is in this set, the SMS is encoded as GSM-7 (160 chars/segment),
// otherwise UCS-2 (70 chars/segment).
const GSM7_CHARS =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà' +
  '^{}\\[~]|€';
const GSM7_SET = new Set(GSM7_CHARS);

const estimateSmsSegments = (
  text: string,
): { encoding: 'GSM' | 'UCS-2'; max: number; segments: number } => {
  const isGsm7 = [...text].every((c) => GSM7_SET.has(c));
  const encoding: 'GSM' | 'UCS-2' = isGsm7 ? 'GSM' : 'UCS-2';
  const max = encoding === 'GSM' ? SMS_SEGMENT_GSM : SMS_SEGMENT_UCS2;
  const segments = text.length === 0 ? 0 : Math.ceil(text.length / max);
  return { encoding, max, segments };
};

export async function sendSms(data: SmsSendRawDataI): Promise<SmsSendResultI> {
  const msg = 'P1SMS sendSms - ';

  const apiKey = process.env.P1SMS_API_KEY;
  const apiUrl = process.env.P1SMS_API_URL ?? DEFAULT_API_URL;
  const channel = (process.env.P1SMS_CHANNEL ?? 'digit') as Channel;
  const sender = process.env.P1SMS_SENDER;
  const dryRun = isDryRun();

  const normalized = normalizePhone(data.phone);
  if (!normalized) {
    logger.warn(msg + 'invalid phone', { phone_input_len: data.phone.length });
    return { success: false, error: 'Некорректный номер телефона.' };
  }

  if (!data.body || data.body.length === 0) {
    logger.error(msg + 'empty body');
    return { success: false, error: GENERIC_USER_ERROR };
  }

  const masked = maskPhone(normalized);
  const reference = data.reference ?? `enki_${Date.now()}`;
  const requiresSender = CHANNELS_REQUIRING_SENDER.includes(channel);

  const segInfo = estimateSmsSegments(data.body);
  if (segInfo.segments > 1) {
    logger.warn(msg + 'message exceeds single SMS segment', {
      length: data.body.length,
      encoding: segInfo.encoding,
      segment_max: segInfo.max,
      segments: segInfo.segments,
    });
  }

  if (requiresSender && !sender) {
    logger.error(msg + 'channel requires sender but P1SMS_SENDER is empty', { channel });
    return { success: false, error: GENERIC_USER_ERROR };
  }

  const smsItem: Record<string, unknown> = {
    channel,
    text: data.body,
    phone: normalized,
  };
  if (requiresSender) smsItem.sender = sender;

  const logBase = {
    phone: masked,
    channel,
    sender: requiresSender ? sender : undefined,
    reference,
    body_len: data.body.length,
    encoding: segInfo.encoding,
    segments: segInfo.segments,
    dry_run: dryRun,
  };

  if (dryRun) {
    logger.info(msg + 'DRY RUN — would send', { ...logBase, request: { sms: [smsItem] } });
    return { success: true, providerId: 'dry-run', rawResponse: JSON.stringify({ sms: [smsItem] }) };
  }

  if (!apiKey) {
    logger.error(msg + 'P1SMS_API_KEY missing');
    return { success: false, error: GENERIC_USER_ERROR };
  }

  const sendUrl = `${apiUrl.replace(/\/$/, '')}/apiSms/create`;
  const requestBody = { apiKey, sms: [smsItem] };

  try {
    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15_000),
    });

    const rawBody = await response.text();
    if (!response.ok) {
      logger.error(msg + 'HTTP error', { ...logBase, status: response.status, raw: rawBody.slice(0, 300) });
      return { success: false, rawResponse: rawBody, error: GENERIC_USER_ERROR };
    }

    let parsed: ProviderSmsResponse;
    try {
      parsed = JSON.parse(rawBody) as ProviderSmsResponse;
    } catch {
      logger.error(msg + 'invalid JSON from provider', { ...logBase, raw: rawBody.slice(0, 300) });
      return { success: false, rawResponse: rawBody, error: GENERIC_USER_ERROR };
    }

    if (parsed.status !== 'success') {
      logger.error(msg + 'provider rejected', {
        ...logBase,
        provider_status: parsed.status,
        provider_error: parsed.error,
        provider_errors: parsed.errors,
      });
      return { success: false, rawResponse: rawBody, error: GENERIC_USER_ERROR };
    }

    const item = parsed.data?.[0];
    if (!item || item.status === 'error') {
      logger.error(msg + 'provider item error', {
        ...logBase,
        item_status: item?.status,
        item_error: item?.error,
        item_error_code: item?.errorCode,
      });
      return { success: false, rawResponse: rawBody, error: GENERIC_USER_ERROR };
    }

    logger.info(msg + 'sent', {
      ...logBase,
      provider_id: item.id,
      provider_status: item.status,
    });
    return {
      success: true,
      providerId: item.id !== undefined ? String(item.id) : undefined,
      rawResponse: rawBody,
    };
  } catch (error) {
    logger.error(msg + 'request failed', { ...logBase, error: (error as Error).message });
    return { success: false, error: GENERIC_USER_ERROR };
  }
}

export async function sendSmsTemplate(
  data: SmsSendTemplateDataI,
): Promise<SmsSendResultI> {
  const body = renderSmsTemplate(data.template, data.params ?? {});
  logger.info('P1SMS template - render', {
    template: data.template,
    reference: data.reference,
  });
  return sendSms({ phone: data.phone, body, reference: data.reference });
}
