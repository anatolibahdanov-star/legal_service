import logger from '@/src/libs/logger';

export interface RecaptchaVerifyResult {
  success: boolean;
  score?: number;
  reason?: 'no_token' | 'no_secret' | 'rejected' | 'low_score' | 'wrong_action' | 'network';
  errorCodes?: string[];
}

interface RecaptchaVerifyOptions {
  expectedAction?: string;
  minScore?: number;
}

interface SiteVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

const DEFAULT_MIN_SCORE = 0.5;

export async function verifyRecaptcha(
  token: string | null | undefined,
  remoteIp?: string | null,
  options: RecaptchaVerifyOptions = {},
): Promise<RecaptchaVerifyResult> {
  const msg = 'recaptcha verify - ';
  if (!token) {
    return { success: false, reason: 'no_token' };
  }

  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) {
    logger.warn(msg + 'RECAPTCHA_SECRET is not set, rejecting');
    return { success: false, reason: 'no_secret' };
  }

  const params = new URLSearchParams({ secret, response: token });
  if (remoteIp) params.set('remoteip', remoteIp);

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await response.json()) as SiteVerifyResponse;
    if (!data.success) {
      logger.warn(msg + 'rejected', { codes: data['error-codes'] });
      return { success: false, reason: 'rejected', errorCodes: data['error-codes'] };
    }

    if (options.expectedAction && data.action && data.action !== options.expectedAction) {
      logger.warn(msg + 'action mismatch', {
        expected: options.expectedAction,
        got: data.action,
      });
      return { success: false, score: data.score, reason: 'wrong_action' };
    }

    if (typeof data.score === 'number') {
      const min = options.minScore ?? DEFAULT_MIN_SCORE;
      if (data.score < min) {
        logger.warn(msg + 'low score', { score: data.score, min });
        return { success: false, score: data.score, reason: 'low_score' };
      }
    }

    return { success: true, score: data.score };
  } catch (error) {
    logger.error(msg + 'network error', { error: (error as Error).message });
    return { success: false, reason: 'network' };
  }
}
