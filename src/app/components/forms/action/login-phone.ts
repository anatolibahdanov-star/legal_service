import { CustomRequest } from '@/src/libs/request';
import { CustomResponseDataI } from '@/src/interfaces/api';

export interface SendOtpPayload {
  phone: string;
  captchaToken: string;
}

export interface VerifyOtpPayload {
  phone: string;
  code: string;
}

export async function sendLoginPhoneOtpAction(payload: SendOtpPayload): Promise<CustomResponseDataI> {
  return CustomRequest('/users/login-phone/send-otp', payload);
}

export async function verifyLoginPhoneOtpAction(payload: VerifyOtpPayload): Promise<CustomResponseDataI> {
  return CustomRequest('/users/login-phone/verify-otp', payload);
}
