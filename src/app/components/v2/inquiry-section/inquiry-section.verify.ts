import {
  wizardCreateQuestionAction,
  wizardSendOtpAction,
  wizardSubmitQuestionAction,
  wizardVerifyOtpAction,
} from '@/src/app/components/forms/action/wizard'
import { completeProfileAction } from '@/src/app/components/forms/action/complete-profile'
import { signInWithPhoneOtp } from '@/src/app/components/forms/action/register-phone'
import {
  needsProfileCompletion,
  normalizePhoneE164,
  phoneToDefaultName,
  phoneToEmail,
} from '@/src/libs/phoneIdentity'
import type { OtpStepResult } from '@/src/app/components/forms/hooks/useOtpStep'

export type VerificationModal = 'none' | 'otp' | 'email'

export const validateTelegramUsername = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return 'Пожалуйста, введите Telegram username'
  const username = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
  if (!/^[a-zA-Z0-9_]{5,32}$/.test(username)) {
    return 'Введите корректный Telegram username'
  }
  return null
}

async function finalizeWizardQuestion(problemText: string, isFirstQuestionFree: boolean) {
  const createResponse = await wizardCreateQuestionAction(problemText.trim())
  if (!createResponse.status) {
    throw new Error(createResponse.error || 'Не удалось сохранить вопрос.')
  }

  const data = createResponse.data as { question?: { id?: string | number } }
  const created = data.question
  if (created?.id == null) {
    throw new Error('Не удалось сохранить вопрос.')
  }

  const submitResponse = await wizardSubmitQuestionAction({
    questionId: created.id,
    paymentMethod: isFirstQuestionFree ? 'free' : 'later',
  })

  if (!submitResponse.status) {
    throw new Error(submitResponse.error || 'Не удалось отправить заявку.')
  }
}

export async function sendInquiryPhoneOtp(
  phone: string,
  captchaToken: string,
): Promise<
  | { ok: true; normalizedPhone: string; devCode?: string }
  | { ok: false; error: string; blockPayload?: { lockedUntil?: string | null; cooldownUntil?: string | null } }
> {
  const response = await wizardSendOtpAction({ phone, captchaToken })
  if (!response.status) {
    const errData = response.data as
      | { lockedUntil?: string | null; cooldownUntil?: string | null }
      | null
    return {
      ok: false,
      error: response.error || 'Не удалось отправить код.',
      blockPayload: errData ?? undefined,
    }
  }

  const data = response.data as { phone: string; devCode?: string }
  return { ok: true, normalizedPhone: data.phone, devCode: data.devCode }
}

export async function resendInquiryPhoneOtp(
  normalizedPhone: string,
  captchaToken: string,
): Promise<OtpStepResult> {
  const response = await wizardSendOtpAction({ phone: normalizedPhone, captchaToken })
  if (!response.status) {
    const errData = response.data as
      | { cooldownUntil?: string | null; lockedUntil?: string | null }
      | null
    return {
      ok: false,
      message: response.error,
      cooldownUntil: errData?.cooldownUntil ?? null,
      lockedUntil: errData?.lockedUntil ?? null,
    }
  }

  const data = response.data as { devCode?: string }
  if (data.devCode) console.info('[DEV] OTP code:', data.devCode)
  return { ok: true, devCode: data.devCode }
}

export async function verifyInquiryPhoneOtp(
  normalizedPhone: string,
  code: string,
  problemText: string,
): Promise<OtpStepResult> {
  const response = await wizardVerifyOtpAction({ phone: normalizedPhone, code })
  if (!response.status) {
    const errData = response.data as
      | { cooldownUntil?: string | null; lockedUntil?: string | null; attemptsLeft?: number | null }
      | null
    return {
      ok: false,
      message: response.error,
      cooldownUntil: errData?.cooldownUntil ?? null,
      lockedUntil: errData?.lockedUntil ?? null,
      attemptsLeft: errData?.attemptsLeft ?? null,
    }
  }

  const data = response.data as {
    phone: string
    verifyToken: string
    user?: { id: number; name: string; email: string } | null
    isFirstQuestionFree?: boolean
  }

  try {
    const user = data.user ?? null
    let isFirstQuestionFree = data.isFirstQuestionFree ?? false

    if (!needsProfileCompletion(user)) {
      const signInResult = await signInWithPhoneOtp(data.phone, data.verifyToken)
      if (!signInResult.status) {
        return { ok: false, message: signInResult.error || 'Ошибка авторизации. Попробуйте позже.' }
      }
      await finalizeWizardQuestion(problemText, isFirstQuestionFree)
      return { ok: true }
    }

    const normalized = normalizePhoneE164(normalizedPhone) ?? normalizePhoneE164(data.phone)
    const e164 = normalized?.e164 ?? data.phone

    const profileResponse = await completeProfileAction({
      name: phoneToDefaultName(e164),
      email: phoneToEmail(e164),
      phone: e164,
      verifyToken: data.verifyToken,
    })

    if (!profileResponse.status) {
      return { ok: false, message: profileResponse.error || 'Не удалось сохранить профиль.' }
    }

    const profileData = profileResponse.data as { isFirstQuestionFree?: boolean }
    if (typeof profileData.isFirstQuestionFree === 'boolean') {
      isFirstQuestionFree = profileData.isFirstQuestionFree
    }

    const signInResult = await signInWithPhoneOtp(e164, data.verifyToken)
    if (!signInResult.status) {
      return { ok: false, message: signInResult.error || 'Ошибка авторизации. Попробуйте позже.' }
    }

    await finalizeWizardQuestion(problemText, isFirstQuestionFree)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Не удалось отправить заявку.',
    }
  }
}
