export enum SmsTemplateE {
  Test = 'test',
  OtpCode = 'otp_code',
  ResetPassword = 'reset_password',
  ApprovedTest = 'approved_test',
  ServiceTest = 'service_test',
}

export interface SmsSendRawDataI {
  phone: string;
  body: string;
  reference?: string;
}

export interface SmsSendTemplateDataI {
  phone: string;
  template: SmsTemplateE;
  params?: Record<string, string>;
  reference?: string;
}

export interface SmsSendResultI {
  success: boolean;
  providerId?: string;
  rawResponse?: string;
  error?: string;
}
