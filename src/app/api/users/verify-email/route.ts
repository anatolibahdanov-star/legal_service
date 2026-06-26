import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailByToken } from '@/src/repositories/users/repo';
import logger from '@/src/libs/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const msg = 'API users/verify-email - ';
  const token = request.nextUrl.searchParams.get('token') ?? '';

  const result = await verifyEmailByToken(token);
  let status: 'success' | 'invalid' | 'error';
  if (result) {
    status = 'success';
  } else if (result === null) {
    status = 'error';
    logger.error(msg + 'verification technical failure', { has_token: !!token });
  } else {
    status = 'invalid';
    logger.warn(msg + 'verification failed: invalid token', { has_token: !!token });
  }

  const redirectUrl = new URL(`/verify-email?status=${status}`, request.nextUrl.origin);
  return NextResponse.redirect(redirectUrl, 303);
}
