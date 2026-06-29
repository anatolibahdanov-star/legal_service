import { useState, useRef, useCallback } from 'react'
import {
  validateRequestForm,
  validateQuestionText,
} from "@/src/app/components/forms/validation/request"
import { EmailValidator } from "@/src/app/components/forms/validation/common"
import { submitRequestFormAction } from "@/src/app/components/forms/action/request"
import { RequestFormI, FormDataObjectT } from "@/src/interfaces/form"
import { isPhoneComplete } from "@/src/libs/phoneMask"
import { useYandexInvisibleCaptcha } from "@/src/app/components/forms/useYandexInvisibleCaptcha"
import { usePhoneBlockCountdown } from "@/src/app/components/forms/hooks/usePhoneBlockCountdown"
import { TOTAL_VISIBLE_STEPS, type ContactChannel } from './inquiry-section.data'
import {
  type VerificationModal,
  sendInquiryPhoneOtp,
  resendInquiryPhoneOtp,
  verifyInquiryPhoneOtp,
  validateTelegramUsername,
} from './inquiry-section.verify'

const emptyErrors = (): FormDataObjectT => ({
  name: "",
  email: "",
  topic: "",
  question: "",
  agree: false,
  common: "",
})

export const useInquirySection = () => {
  const { execute: executeCaptcha } = useYandexInvisibleCaptcha({ variant: "dark" })
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

  const goNext = () => {
    if (step >= TOTAL_VISIBLE_STEPS) return

    setErrors(emptyErrors())

    if (step === 1) {
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
      if (channel === 'phone' || channel === 'whatsapp') {
        const result = await sendInquiryPhoneOtp(contactValue, token)
        setCaptchaToken(null)

        if (!result.ok) {
          phoneBlock.applyFromServer(result.blockPayload)
          setErrors(prev => ({ ...prev, common: result.error }))
          return
        }

        if (result.devCode) console.info('[DEV] OTP code:', result.devCode)
        setNormalizedPhone(result.normalizedPhone)
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

  const closeVerificationModal = useCallback(() => {
    setVerificationModal('none')
  }, [])

  const handleOtpVerify = useCallback(async (code: string) => {
    const result = await verifyInquiryPhoneOtp(normalizedPhone, code, problemText)
    if (result.ok) {
      setVerificationModal('none')
      setIsComplete(true)
    }
    return result
  }, [normalizedPhone, problemText])

  const handleOtpResend = useCallback(async () => {
    let token: string
    try {
      token = await executeCaptcha()
    } catch {
      return { ok: false, message: 'Не удалось пройти проверку. Попробуйте позже.' }
    }
    return resendInquiryPhoneOtp(normalizedPhone, token)
  }, [executeCaptcha, normalizedPhone])

  const confirmEmailModal = useCallback(() => {
    setVerificationModal('none')
    setIsComplete(true)
  }, [])

  const isLastStep = step === TOTAL_VISIBLE_STEPS

  return {
    step,
    direction,
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
    verificationModal,
    normalizedPhone,
    pendingEmail,
    goNext,
    goBack,
    handleSubmit,
    closeVerificationModal,
    handleOtpVerify,
    handleOtpResend,
    confirmEmailModal,
    setProblemText,
    setAttachedFiles,
    setChannel,
    setContactValue,
    setCaptchaToken,
    setQuestionTouched,
    validateQuestionText,
  }
}
