import { CustomRequest, CustomGetRequest } from '@/src/libs/request';
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

/**
 * Returns the price / balance / first-question-free state for the currently
 * signed-in user. Used by the wizard to short-circuit phone/OTP/profile steps
 * and decide between free / pay-with-balance / show-payment-step directly
 * from step 1.
 */
export async function wizardAuthInitAction(): Promise<CustomResponseDataI> {
  return CustomGetRequest('/wizard/auth-init');
}

/**
 * Step 3 of the wizard: creates the question in the DB with status Unpaid
 * as soon as the user is authenticated. Returns the question id+uuid which
 * Step 5 then passes to the payment endpoints.
 */
export async function wizardCreateQuestionAction(
  question: string,
): Promise<CustomResponseDataI> {
  return CustomRequest('/wizard/create-question', { question });
}

/**
 * Same wizard session, user went back to Step 1 and edited the text.
 * Updates the existing Unpaid row instead of creating a duplicate.
 */
export async function wizardUpdateQuestionTextAction(
  questionId: string | number,
  question: string,
): Promise<CustomResponseDataI> {
  return CustomRequest('/wizard/create-question', { questionId, question }, 'PATCH');
}

export type WizardPaymentMethod = 'free' | 'later';

export interface SubmitQuestionPayload {
  questionId: string | number;
  paymentMethod: WizardPaymentMethod;
}

/**
 * Step 5 of the wizard for non-gateway payment methods:
 *   - 'free'  : flips question status Unpaid → InProgress (server checks
 *               first-question-free benefit).
 *   - 'later' : no status change; the client just shows "Ваш вопрос сохранён"
 *               and navigates to LK.
 */
export async function wizardSubmitQuestionAction(
  payload: SubmitQuestionPayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/wizard/submit-question', payload);
}

/**
 * Creates a one-shot Alfa order for paying for a single question.
 * The questionId travels along the order (porder.data + porder.question_id)
 * so that when Alfa later confirms payment via checkOrderStatus, the backend
 * flips the question's status to InProgress.
 */
export async function createWizardCardOrderAction(
  amount: number,
  questionId: string | number,
): Promise<CustomResponseDataI> {
  return CustomRequest('/orders/', {
    amount,
    orderNumber: `wizard_${Date.now()}`,
    type: OrderTypeE.OneTime,
    data: { questionId },
  });
}

export type WizardSource = 'lk' | 'main';

export interface PayWithBalancePayload {
  questionId: string | number;
  idempotencyKey: string;
  source: WizardSource;
}

/**
 * Atomically charges the user's balance for an existing Unpaid question,
 * creates an order, and flips the question's status to InProgress.
 * Idempotent on the server side via idempotencyKey.
 */
export async function payWithBalanceAction(
  payload: PayWithBalancePayload,
): Promise<CustomResponseDataI> {
  return CustomRequest('/wizard/pay-with-balance', payload);
}
