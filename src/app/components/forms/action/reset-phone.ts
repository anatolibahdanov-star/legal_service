import { CustomRequest } from '@/src/libs/request';
import { CustomResponseDataI } from '@/src/interfaces/api';

export interface ResetPhoneSendOtpPayload {
  phone: string;
  captchaToken: string;
}

export interface ResetPhoneVerifyOtpPayload {
  phone: string;
  code: string;
}

export async function sendResetPhoneOtpAction(
  payload: ResetPhoneSendOtpPayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/users/reset-phone/send-otp', payload);
}

export async function verifyResetPhoneOtpAction(
  payload: ResetPhoneVerifyOtpPayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/users/reset-phone/verify-otp', payload);
}
