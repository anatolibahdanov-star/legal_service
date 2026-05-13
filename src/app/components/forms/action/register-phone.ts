import { signIn } from 'next-auth/react';
import { CustomRequest } from '@/src/libs/request';
import { CustomResponseDataI } from '@/src/interfaces/api';

export interface SendOtpPayload {
  phone: string;
  captchaToken: string;
}

export interface VerifyOtpPayload {
  phone: string;
  code: string;
  wizardMode?: boolean;
}

export async function sendPhoneOtpAction(payload: SendOtpPayload): Promise<CustomResponseDataI> {
  return CustomRequest('/users/register-phone/send-otp', payload);
}

export async function verifyPhoneOtpAction(payload: VerifyOtpPayload): Promise<CustomResponseDataI> {
  return CustomRequest('/users/register-phone/verify-otp', payload);
}

export async function signInWithPhoneOtp(
  phone: string,
  verifyToken: string,
): Promise<{ status: boolean; error: string }> {
  const response = await signIn('phone-otp', {
    phone,
    verifyToken,
    redirect: false,
  });
  if (response?.error) {
    return { status: false, error: response.error };
  }
  return { status: true, error: '' };
}
