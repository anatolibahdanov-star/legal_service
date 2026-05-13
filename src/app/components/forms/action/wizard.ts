import { CustomRequest } from '@/src/libs/request';
import { CustomResponseDataI } from '@/src/interfaces/api';
import { OrderTypeE } from '@/src/interfaces/payment';

export interface WizardSendOtpPayload {
  phone: string;
  captchaToken: string;
}

export interface WizardVerifyOtpPayload {
  phone: string;
  code: string;
}

/**
 * Unified wizard send-otp. The server decides register vs login internally
 * and reports back via `isLogin`. One request, one response — no more
 * register-then-login fallback chain in the network tab.
 */
export async function wizardSendOtpAction(
  payload: WizardSendOtpPayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/wizard/send-otp', payload);
}

/**
 * Unified wizard verify-otp. Never creates a user. Returns `user` (existing
 * or null) + `isLogin` flag so the caller can decide signIn-vs-profile-step.
 */
export async function wizardVerifyOtpAction(
  payload: WizardVerifyOtpPayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/wizard/verify-otp', payload);
}

export type WizardPaymentMethod = 'free' | 'later';

export interface SubmitQuestionPayload {
  question: string;
  paymentMethod: WizardPaymentMethod;
}

/**
 * Wizard-side question submission for methods that don't go through Alfa:
 * "free" (first-question-free benefit) and "later" (saved as Unpaid).
 * Returns the created question on success.
 */
export async function wizardSubmitQuestionAction(
  payload: SubmitQuestionPayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/wizard/submit-question', payload);
}

/**
 * Creates a one-shot Alfa order for paying for a single question.
 * The question text travels along the order (porder.data) so that when
 * Alfa later confirms payment via checkOrderStatus, the backend can
 * create the question and link it to the order — without us having to
 * persist the question on the client side across the Alfa redirect.
 */
export async function createWizardCardOrderAction(
  amount: number,
  questionText: string,
): Promise<CustomResponseDataI> {
  return CustomRequest('/orders/', {
    amount,
    orderNumber: `wizard_${Date.now()}`,
    type: OrderTypeE.OneTime,
    data: { question: questionText },
  });
}

export interface PayWithBalancePayload {
  question: string;
  idempotencyKey: string;
}

/**
 * Atomically charges the user's balance for one question, creates an
 * order, the question itself (InProgress) and links them together.
 * Idempotent on the server side via idempotencyKey.
 */
export async function payWithBalanceAction(
  payload: PayWithBalancePayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/wizard/pay-with-balance', payload);
}
