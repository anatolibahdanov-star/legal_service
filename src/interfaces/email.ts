export interface EmailDataI {
  recipient: string;
  username: string;
  url: string;
}

export interface EmailDataForgotI {
  recipient: string;
  username: string;
  password: string;
  url: string;
  url_about: string;
}

export interface EmailDataVerifyI {
  recipient: string;
  username: string;
  password: string;
  url: string;
}

export interface EmailDataVerifyNewI {
  recipient: string;
  username: string;
  url: string;
}

export interface EmailDataBrandedI {
  recipient: string;
  subject: string;
  /** Plain-text body with placeholders already substituted (no CTA/footer). */
  bodyText: string;
  buttonLabel: string;
  buttonUrl: string;
}

export interface EmailDataBalanceI extends EmailDataBrandedI {
  /** true = successful top-up, false = failed top-up (informational). */
  success: boolean;
}

export interface EmailDataNewRequestI {
  email: string;
  username: string;
  id: string;
  admin_id?: number|null;
}

export interface EmailLawRatingDataI {
  user_id: number;
  user_name: string;
  admin_id: number|null;
  admin_name: string;
  question_id: string;
  question_rating: number;
  question_rating_comment: string;
  created_at: string;
}

export interface EmailContactDataI {
  id: number;
  user_id: number|null;
  user_name: string|null;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}

export interface EmailPdfAttachmentI {
  recipient: string;
  question_id: number | string;
  /** Subject of the original question — shown in the body as "Тема вопроса". */
  question_subject: string;
  /** Issue date (created_at of the root question) — pre-formatted by caller. */
  question_date: string;
  /** Raw PDF bytes pulled from File Storage by the caller. */
  pdf: Uint8Array;
  /** Filename presented to the recipient (e.g. `enki-answer-48.pdf`). */
  filename: string;
}