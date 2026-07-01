'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  validateRequestForm,
  validateQuestionText,
} from "@/src/app/components/forms/validation/request"
import { EmailValidator } from "@/src/app/components/forms/validation/common"
import { submitRequestFormAction } from "@/src/app/components/forms/action/request"
import { signInWithPhoneOtp } from "@/src/app/components/forms/action/register-phone"
import { completeProfileAction } from "@/src/app/components/forms/action/complete-profile"
import {
  createWizardCardOrderAction,
  payWithBalanceAction,
  wizardAuthInitAction,
  wizardCreateQuestionAction,
  wizardSubmitQuestionAction,
  wizardUpdateQuestionTextAction,
  wizardVerifyOtpAction,
} from "@/src/app/components/forms/action/wizard"
import { RequestFormI, FormDataObjectT } from "@/src/interfaces/form"
import { isPhoneComplete } from "@/src/libs/phoneMask"
import { useYandexInvisibleCaptcha } from "@/src/app/components/forms/useYandexInvisibleCaptcha"
import { usePhoneBlockCountdown } from "@/src/app/components/forms/hooks/usePhoneBlockCountdown"
import type { OtpStepResult } from "@/src/app/components/forms/hooks/useOtpStep"
import type { CompleteProfileResult } from "@/src/app/components/forms/RequestStepProfile"
import type { SuccessVariant } from "@/src/app/components/forms/RequestStepSuccess"
import { emitBalanceRefresh } from "@/src/libs/balanceEvents"
import { isPhoneEmail, needsProfileCompletion, phoneToDefaultName } from "@/src/libs/phoneIdentity"
import { TOTAL_VISIBLE_STEPS, type ContactChannel } from './inquiry-section.data'
import {
  type VerificationModal,
  sendInquiryPhoneOtp,
  resendInquiryPhoneOtp,
  validateTelegramUsername,
} from './inquiry-section.verify'

type InquiryPanel = 'quiz' | 'profile' | 'payment' | 'success'

const emptyErrors = (): FormDataObjectT => ({
  name: "",
  email: "",
  topic: "",
  question: "",
  agree: false,
  common: "",
})

export const useInquirySection = () => {
  const { data: session, status: sessionStatus } = useSession()
  const { execute: executeCaptcha } = useYandexInvisibleCaptcha({ variant: "light" })
  const phoneBlock = usePhoneBlockCountdown()

  // Navigation state
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [isComplete, setIsComplete] = useState(false)
  const directionRef = useRef(1)

  // Form data
  const [problemText, setProblemText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [channel, setChannel] = useState<ContactChannel>('phone')
  const [contactValue, setContactValue] = useState('')

  // Verification modals
  const [verificationModal, setVerificationModal] = useState<VerificationModal>('none')
  const [normalizedPhone, setNormalizedPhone] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')

  // Validation and submission
  const [errors, setErrors] = useState<FormDataObjectT>(emptyErrors())
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [questionTouched, setQuestionTouched] = useState(false)

  // Phone wizard state. Mirrors the old RequestForm business flow while the
  // surrounding UI stays in the v2 inquiry section.
  const [panel, setPanel] = useState<InquiryPanel>('quiz')
  const [verifiedUser, setVerifiedUser] = useState<{ id: number; name: string; email: string } | null>(null)
  const [verifyToken, setVerifyToken] = useState('')
  const [isFirstQuestionFree, setIsFirstQuestionFree] = useState(false)
  const [questionPrice, setQuestionPrice] = useState(0)
  const [userBalance, setUserBalance] = useState(0)
  const [successKind, setSuccessKind] = useState<SuccessVariant>('free')
  const [successAmount, setSuccessAmount] = useState(0)
  const questionIdRef = useRef<string | number | null>(null)
  const questionUuidRef = useRef<string | null>(null)
  const committedQuestionTextRef = useRef('')
  const [paymentIdempotencyKey, setPaymentIdempotencyKey] = useState(
    () => `inquiry_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  )

  const resetForm = () => {
    directionRef.current = 1
    setStep(1)
    setDirection(1)
    setIsComplete(false)
    setProblemText('')
    setAttachedFiles([])
    setChannel('phone')
    setContactValue('')
    setVerificationModal('none')
    setNormalizedPhone('')
    setPendingEmail('')
    setErrors(emptyErrors())
    setCaptchaToken(null)
    setSubmitting(false)
    setQuestionTouched(false)
    setPanel('quiz')
    setVerifiedUser(null)
    setVerifyToken('')
    setIsFirstQuestionFree(false)
    setQuestionPrice(0)
    setUserBalance(0)
    setSuccessKind('free')
    setSuccessAmount(0)
    questionIdRef.current = null
    questionUuidRef.current = null
    committedQuestionTextRef.current = ''
    setPaymentIdempotencyKey(
      `inquiry_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    )
  }

  const handleNextAuthed = async () => {
    setQuestionTouched(true)
    const questionError = validateQuestionText(problemText)
    if (questionError || submitting) {
      if (questionError) setErrors((prev) => ({ ...prev, question: questionError }))
      return
    }

    setSubmitting(true)
    setErrors(emptyErrors())
    try {
      const initResponse = await wizardAuthInitAction()
      if (!initResponse.status) {
        setErrors((prev) => ({
          ...prev,
          common: initResponse.error || "Не удалось получить данные пользователя. Попробуйте позже.",
        }))
        return
      }

      const initData = initResponse.data as {
        isFirstQuestionFree?: boolean
        questionPrice?: number
        userBalance?: number
      }
      const isFirstFree = !!initData.isFirstQuestionFree
      const price = typeof initData.questionPrice === 'number' ? initData.questionPrice : 0
      const balance = typeof initData.userBalance === 'number' ? initData.userBalance : 0

      setIsFirstQuestionFree(isFirstFree)
      setQuestionPrice(price)
      setUserBalance(balance)

      const ensured = await ensureUnpaidQuestionExists()
      if (!ensured.ok) {
        setErrors((prev) => ({
          ...prev,
          common: ensured.message || "Не удалось сохранить вопрос.",
        }))
        return
      }

      if (isFirstFree) {
        const result = await submitFreeAndShowSuccess()
        if (!result.ok) {
          setErrors((prev) => ({
            ...prev,
            common: result.message || "Не удалось сохранить вопрос.",
          }))
        }
        return
      }

      if (balance >= price) {
        const result = await handlePayBalance()
        if (!result.ok) {
          setErrors((prev) => ({
            ...prev,
            common: result.message || "Не удалось списать с баланса. Выберите способ оплаты.",
          }))
          setPanel('payment')
        }
        return
      }

      setPanel('payment')
    } finally {
      setSubmitting(false)
    }
  }

  const goNext = () => {
    if (step >= TOTAL_VISIBLE_STEPS) return

    setErrors(emptyErrors())

    if (step === 1) {
      if (session?.user) {
        void handleNextAuthed()
        return
      }

      setQuestionTouched(true)
      const questionError = validateQuestionText(problemText)
      if (questionError) {
        setErrors(prev => ({ ...prev, question: questionError }))
        return
      }
    }

    directionRef.current = 1
    setDirection(1)
    setStep(s => s + 1)
  }

  const goBack = () => {
    if (step <= 1) return
    directionRef.current = -1
    setDirection(-1)
    setStep(s => s - 1)
  }

  const handleProblemTextChange = (value: string) => {
    setProblemText(value)
    setErrors((prev) => {
      if (!prev.question) return prev
      return {
        ...prev,
        question: "",
        common: prev.common === prev.question ? "" : prev.common,
      }
    })
  }

  const buildRequestPayload = (): RequestFormI => {
    const contact = contactValue.trim()
    let name = 'Пользователь'
    let email = ''

    if (channel === 'email') {
      email = contact
    } else if (channel === 'phone' || channel === 'whatsapp') {
      name = contact
      email = `${contact.replace(/\D/g, '')}@phone.enki.local`
    } else {
      const username = contact.replace(/^@/, '')
      name = `@${username}`
      email = `${username}@telegram.enki.local`
    }

    return {
      name,
      email,
      topic: '',
      question: problemText,
      agree: true,
      auth: '0',
    }
  }

  const validateContactStep = (): FormDataObjectT | null => {
    const newErrors = emptyErrors()

    const questionError = validateQuestionText(problemText)
    if (questionError) {
      newErrors.question = questionError
      newErrors.common = questionError
      return newErrors
    }

    if (!contactValue.trim()) {
      if (channel === 'phone' || channel === 'whatsapp') {
        newErrors.common = "Пожалуйста, введите номер телефона"
      } else if (channel === 'email') {
        newErrors.common = "Пожалуйста, введите email"
      } else if (channel === 'telegram') {
        newErrors.common = "Пожалуйста, введите Telegram username"
      }
      return newErrors
    }

    if (channel === 'email' && !EmailValidator(contactValue)) {
      newErrors.email = "Пожалуйста, введите корректный email"
      newErrors.common = "Пожалуйста, введите корректный email"
      return newErrors
    }

    if ((channel === 'phone' || channel === 'whatsapp') && !isPhoneComplete(contactValue)) {
      newErrors.common = "Пожалуйста, введите корректный номер телефона"
      return newErrors
    }

    if (channel === 'telegram') {
      const telegramError = validateTelegramUsername(contactValue)
      if (telegramError) {
        newErrors.common = telegramError
        return newErrors
      }
    }

    if (!captchaToken) {
      newErrors.common = "Подтвердите, что вы не робот."
      return newErrors
    }

    const validResult = validateRequestForm(buildRequestPayload())
    if (!validResult.is_success) {
      const firstError = validResult.errors?.[0]?.error?.[0]
      newErrors.common = firstError ?? "Проверьте правильность заполнения полей."
      return newErrors
    }

    return null
  }

  const submitAnonymousRequest = async (token: string) => {
    const responseData = await submitRequestFormAction(buildRequestPayload(), token)
    if (!responseData.status) {
      throw new Error(responseData.error || 'Произошла ошибка при отправке. Попробуйте еще раз.')
    }
  }

  const ensureUnpaidQuestionExists = async (): Promise<
    { ok: true; id: string | number; uuid: string } | { ok: false; message: string }
  > => {
    const currentText = problemText.trim()
    const existingId = questionIdRef.current

    if (existingId !== null) {
      if (currentText === committedQuestionTextRef.current) {
        return { ok: true, id: existingId, uuid: questionUuidRef.current ?? '' }
      }

      const patch = await wizardUpdateQuestionTextAction(existingId, currentText)
      if (!patch.status) {
        return { ok: false, message: patch.error || 'Не удалось обновить текст вопроса.' }
      }
      committedQuestionTextRef.current = currentText
      return { ok: true, id: existingId, uuid: questionUuidRef.current ?? '' }
    }

    const response = await wizardCreateQuestionAction(currentText)
    if (!response.status) {
      return { ok: false, message: response.error || 'Не удалось сохранить вопрос.' }
    }

    const data = response.data as { question?: { id?: string | number; uuid?: string } }
    const created = data.question
    if (!created?.id) {
      return { ok: false, message: 'Не удалось сохранить вопрос.' }
    }

    questionIdRef.current = created.id
    questionUuidRef.current = created.uuid ?? null
    committedQuestionTextRef.current = currentText
    return { ok: true, id: created.id, uuid: created.uuid ?? '' }
  }

  const submitFreeAndShowSuccess = async (): Promise<{ ok: boolean; message?: string }> => {
    const ensured = await ensureUnpaidQuestionExists()
    if (!ensured.ok) return { ok: false, message: ensured.message }

    const response = await wizardSubmitQuestionAction({
      questionId: ensured.id,
      paymentMethod: 'free',
    })
    if (!response.status) {
      return { ok: false, message: response.error || 'Не удалось сохранить вопрос.' }
    }

    setSuccessKind('free')
    setSuccessAmount(0)
    setPanel('success')
    return { ok: true }
  }

  const showPayLaterSuccess = async (): Promise<{ ok: boolean; message?: string }> => {
    const ensured = await ensureUnpaidQuestionExists()
    if (!ensured.ok) return { ok: false, message: ensured.message }

    const response = await wizardSubmitQuestionAction({
      questionId: ensured.id,
      paymentMethod: 'later',
    })
    if (!response.status) {
      return { ok: false, message: response.error || 'Не удалось сохранить вопрос.' }
    }

    setSuccessKind('later')
    setSuccessAmount(0)
    setPanel('success')
    return { ok: true }
  }

  const handleSubmit = async () => {
    if (submitting) return

    const validationErrors = validateContactStep()
    if (validationErrors) {
      setErrors(validationErrors)
      return
    }

    const token = captchaToken!
    setSubmitting(true)
    setErrors(emptyErrors())

    try {
      if (channel === 'phone') {
        const result = await sendInquiryPhoneOtp(contactValue, token)
        setCaptchaToken(null)

        if (!result.ok) {
          phoneBlock.applyFromServer(result.blockPayload)
          setErrors(prev => ({ ...prev, common: result.error }))
          return
        }

        setNormalizedPhone(result.normalizedPhone)
        if (result.devCode) {
          console.info('[DEV] OTP code:', result.devCode)
        }
        setVerificationModal('otp')
        return
      }

      if (channel === 'email') {
        await submitAnonymousRequest(token)
        setCaptchaToken(null)
        setPendingEmail(contactValue.trim())
        setVerificationModal('email')
        return
      }

      await submitAnonymousRequest(token)
      setCaptchaToken(null)
      setIsComplete(true)
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        common: error instanceof Error ? error.message : 'Произошла ошибка при отправке. Попробуйте еще раз.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  const closeVerificationModal = () => {
    setVerificationModal('none')
  }

  const verifyOtpCode = async (phone: string, code: string): Promise<OtpStepResult> => {
    const response = await wizardVerifyOtpAction({ phone, code })
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
      questionPrice?: number
      userBalance?: number
    }

    setVerifyToken(data.verifyToken)
    setIsFirstQuestionFree(data.isFirstQuestionFree ?? false)
    if (typeof data.questionPrice === 'number') setQuestionPrice(data.questionPrice)
    if (typeof data.userBalance === 'number') setUserBalance(data.userBalance)

    const user = data.user ?? null
    if (user) setVerifiedUser(user)

    if (needsProfileCompletion(user)) {
      setVerificationModal('none')
      setPanel('profile')
      return { ok: true }
    }

    const signInResult = await signInWithPhoneOtp(data.phone, data.verifyToken)
    if (!signInResult.status) {
      return { ok: false, message: signInResult.error || 'Ошибка авторизации. Попробуйте позже.' }
    }

    const ensured = await ensureUnpaidQuestionExists()
    if (!ensured.ok) {
      return { ok: false, message: ensured.message }
    }

    if (data.isFirstQuestionFree) {
      const submitted = await submitFreeAndShowSuccess()
      if (!submitted.ok) {
        return { ok: false, message: submitted.message }
      }
      setVerificationModal('none')
      return { ok: true }
    }

    setVerificationModal('none')
    setPanel('payment')
    return { ok: true }
  }

  const handleOtpVerify = async (code: string): Promise<OtpStepResult> => {
    return verifyOtpCode(normalizedPhone, code)
  }

  const handleOtpResend = async () => {
    let token: string
    try {
      token = await executeCaptcha()
    } catch {
      return { ok: false, message: 'Не удалось пройти проверку. Попробуйте позже.' }
    }
    return resendInquiryPhoneOtp(normalizedPhone, token)
  }

  const confirmEmailModal = () => {
    setVerificationModal('none')
    setIsComplete(true)
  }

  const handleProfileSubmit = async (name: string, email: string): Promise<CompleteProfileResult> => {
    const response = await completeProfileAction({
      name,
      email,
      phone: normalizedPhone,
      verifyToken,
    })
    if (!response.status) {
      return { ok: false, message: response.error }
    }

    const data = response.data as {
      user?: { id: number; name: string; email: string }
      verificationEmailSent?: boolean
      isFirstQuestionFree?: boolean
      questionPrice?: number
      userBalance?: number
    }
    if (data.user) setVerifiedUser(data.user)
    if (typeof data.isFirstQuestionFree === 'boolean') setIsFirstQuestionFree(data.isFirstQuestionFree)
    if (typeof data.questionPrice === 'number') setQuestionPrice(data.questionPrice)
    if (typeof data.userBalance === 'number') setUserBalance(data.userBalance)

    const signInResult = await signInWithPhoneOtp(normalizedPhone, verifyToken)
    if (!signInResult.status) {
      return { ok: false, message: signInResult.error || 'Ошибка авторизации. Попробуйте позже.' }
    }

    const ensured = await ensureUnpaidQuestionExists()
    if (!ensured.ok) {
      return { ok: false, message: ensured.message }
    }

    return { ok: true, verificationEmailSent: data.verificationEmailSent }
  }

  const handleProfileContinue = () => {
    if (isFirstQuestionFree) {
      submitFreeAndShowSuccess().then((result) => {
        if (!result.ok) setPanel('payment')
      })
      return
    }
    setPanel('payment')
  }

  const handlePayCard = async (): Promise<{ ok: boolean; message?: string }> => {
    const ensured = await ensureUnpaidQuestionExists()
    if (!ensured.ok) return { ok: false, message: ensured.message }

    const response = await createWizardCardOrderAction(questionPrice, ensured.id)
    if (!response.status) {
      return { ok: false, message: response.error || 'Не удалось создать платёж.' }
    }
    const order = response.data as { alpha_form_url?: string }
    if (!order.alpha_form_url) {
      return { ok: false, message: 'Платёжная форма недоступна.' }
    }
    window.location.href = order.alpha_form_url
    return { ok: true }
  }

  const handlePayBalance = async (): Promise<{ ok: boolean; message?: string }> => {
    const ensured = await ensureUnpaidQuestionExists()
    if (!ensured.ok) return { ok: false, message: ensured.message }

    const response = await payWithBalanceAction({
      questionId: ensured.id,
      idempotencyKey: paymentIdempotencyKey,
      source: 'main',
    })
    if (!response.status) {
      return { ok: false, message: response.error || 'Не удалось провести оплату с баланса.' }
    }

    const data = response.data as { amount?: number }
    setSuccessKind('balance')
    setSuccessAmount(typeof data.amount === 'number' ? data.amount : questionPrice)
    emitBalanceRefresh()
    setPanel('success')
    return { ok: true }
  }

  const goToMyQuestions = () => {
    if (typeof window === 'undefined') return
    const path = window.location.pathname.replace(/\/$/, '') || ''
    const localeMatch = path.match(/^(\/[^/]+)/)
    const target = localeMatch ? `${localeMatch[1]}/profile` : '/profile'
    window.location.assign(`${target}?tab=cases`)
  }

  const goToBalance = () => {
    if (typeof window === 'undefined') return
    const path = window.location.pathname.replace(/\/$/, '') || ''
    const localeMatch = path.match(/^(\/[^/]+)/)
    const target = localeMatch ? `${localeMatch[1]}/profile` : '/profile'
    window.location.assign(`${target}?tab=balance`)
  }

  const isLastStep = step === TOTAL_VISIBLE_STEPS
  const isAuthed = !!session?.user
  const isSessionLoading = sessionStatus === 'loading'
  const placeholderName = normalizedPhone ? phoneToDefaultName(normalizedPhone) : null
  const profileInitialName = verifiedUser?.name && verifiedUser.name !== placeholderName
    ? verifiedUser.name
    : ''
  const profileInitialEmail = verifiedUser?.email && !isPhoneEmail(verifiedUser.email)
    ? verifiedUser.email
    : ''

  return {
    step,
    direction,
    panel,
    isComplete,
    problemText,
    attachedFiles,
    channel,
    contactValue,
    errors,
    captchaToken,
    submitting,
    questionTouched,
    isLastStep,
    isAuthed,
    isSessionLoading,
    verificationModal,
    normalizedPhone,
    pendingEmail,
    profileInitialName,
    profileInitialEmail,
    questionPrice,
    userBalance,
    successKind,
    successAmount,
    goNext,
    goBack,
    handleSubmit,
    closeVerificationModal,
    handleOtpVerify,
    handleOtpResend,
    confirmEmailModal,
    handleProfileSubmit,
    handleProfileContinue,
    handlePayCard,
    handlePayBalance,
    handlePayLater: showPayLaterSuccess,
    goToMyQuestions,
    goToBalance,
    resetForm,
    setProblemText: handleProblemTextChange,
    setAttachedFiles,
    setChannel: (next: ContactChannel) => {
      setChannel(next)
      setContactValue('')
      setErrors(emptyErrors())
    },
    setContactValue,
    setCaptchaToken,
    setQuestionTouched,
    validateQuestionText,
  }
}
