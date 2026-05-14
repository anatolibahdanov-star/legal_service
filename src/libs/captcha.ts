import logger from '@/src/libs/logger';

export interface CaptchaVerifyResult {
  success: boolean;
  reason?: 'no_token' | 'no_secret' | 'rejected' | 'network';
  host?: string;
}

interface SmartCaptchaValidateResponse {
  status?: 'ok' | 'failed';
  message?: string;
  host?: string;
}

export interface VerifyCaptchaOptions {
  /**
   * Selects which SmartCaptcha server key to validate against. Must match
   * the variant used on the client when issuing the token — Yandex pairs
   * each site key with its own secret, so cross-pair validation always
   * returns `rejected`.
   */
  variant?: 'light' | 'dark';
}

/**
 * Server-side verification for Yandex SmartCaptcha tokens.
 * Docs: https://yandex.cloud/ru/docs/smartcaptcha/concepts/validation
 */
export async function verifyCaptcha(
  token: string | null | undefined,
  remoteIp?: string | null,
  options: VerifyCaptchaOptions = {},
): Promise<CaptchaVerifyResult> {
  const msg = 'smartcaptcha verify - ';
  if (!token) {
    return { success: false, reason: 'no_token' };
  }

  const variant = options.variant ?? 'light';
  const envName = variant === 'dark'
    ? 'YANDEX_SMARTCAPTCHA_SERVER_KEY_DARK'
    : 'YANDEX_SMARTCAPTCHA_SERVER_KEY';
  const secret = process.env[envName];
  if (!secret) {
    logger.warn(msg + envName + ' is not set, rejecting');
    return { success: false, reason: 'no_secret' };
  }

  const params = new URLSearchParams({ secret, token });
  if (remoteIp) params.set('ip', remoteIp);

  try {
    const response = await fetch('https://smartcaptcha.yandexcloud.net/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await response.json()) as SmartCaptchaValidateResponse;
    if (data.status !== 'ok') {
      logger.warn(msg + 'rejected', { message: data.message });
      return { success: false, reason: 'rejected' };
    }
    return { success: true, host: data.host };
  } catch (error) {
    logger.error(msg + 'network error', { error: (error as Error).message });
    return { success: false, reason: 'network' };
  }
}
