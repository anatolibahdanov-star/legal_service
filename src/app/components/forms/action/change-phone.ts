import { CustomRequest } from '@/src/libs/request';
import { CustomResponseDataI } from '@/src/interfaces/api';

export interface SendChangePhoneOtpPayload {
  phone: string;
  captchaToken: string;
}

export interface VerifyChangePhoneOtpPayload {
  phone: string;
  code: string;
}

export async function sendChangePhoneOtpAction(
  payload: SendChangePhoneOtpPayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/users/change-phone/send-otp', payload);
}

export async function verifyChangePhoneOtpAction(
  payload: VerifyChangePhoneOtpPayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/users/change-phone/verify-otp', payload);
}
