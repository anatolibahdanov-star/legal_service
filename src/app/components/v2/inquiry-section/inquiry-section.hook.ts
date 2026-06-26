import { useState, useRef } from 'react'
import {
  validateRequestForm,
  validateQuestionText,
} from "@/src/app/components/forms/validation/request"
import { submitRequestFormAction } from "@/src/app/components/forms/action/request"
import { RequestFormI, FormDataObjectT } from "@/src/interfaces/form"
import { useYandexInvisibleCaptcha } from "@/src/app/components/forms/useYandexInvisibleCaptcha"
import { TOTAL_VISIBLE_STEPS, type ContactChannel } from './inquiry-section.data'

export const useInquirySection = () => {
  const { execute: executeCaptcha } = useYandexInvisibleCaptcha({ variant: "dark" })
  
  // Navigation state
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [isComplete, setIsComplete] = useState(false)
  const directionRef = useRef(1)

  // Form data
  const [problemText, setProblemText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [complexity, setComplexity] = useState('medium')
  const [channel, setChannel] = useState<ContactChannel>('phone')
  const [contactValue, setContactValue] = useState('')
  
  // Validation and submission
  const [errors, setErrors] = useState<FormDataObjectT>({ 
    name: "", email: "", topic: "", question: "", agree: false, common: "" 
  })
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [questionTouched, setQuestionTouched] = useState(false)

  // Navigation functions
  const goNext = () => {
    if (step >= TOTAL_VISIBLE_STEPS) return
    
    // Сбрасываем ошибки
    setErrors({ name: "", email: "", topic: "", question: "", agree: false, common: "" })
    
    // Валидация для каждого шага
    if (step === 1) {
      // Шаг 1: Проверяем что есть текст проблемы
      setQuestionTouched(true) // Устанавливаем touched при попытке перехода
      if (!problemText.trim()) {
        setErrors(prev => ({ ...prev, question: "Пожалуйста, опишите вашу проблему" }))
        return
      }
      if (problemText.trim().length < 10) {
        setErrors(prev => ({ ...prev, question: "Пожалуйста, опишите проблему подробнее (минимум 10 символов)" }))
        return
      }
    }
    
    if (step === 2) {
      // Шаг 2: Проверяем выбор сложности
      if (!complexity) {
        setErrors(prev => ({ ...prev, common: "Пожалуйста, выберите сложность вашего дела" }))
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

  // Validation and submission logic
  const validateAndSubmit = async () => {
    const newErrors: FormDataObjectT = { 
      name: "", email: "", topic: "", question: "", agree: false, common: "" 
    }

    // Check problem text first
    const questionError = validateQuestionText(problemText)
    if (questionError) {
      newErrors.question = questionError
      setErrors(newErrors)
      return false
    }

    // Check complexity
    if (!complexity) {
      newErrors.common = "Пожалуйста, выберите сложность вашего дела"
      setErrors(newErrors)
      return false
    }

    // Check contact value
    if (!contactValue.trim()) {
      if (channel === 'phone' || channel === 'whatsapp') {
        newErrors.common = "Пожалуйста, введите номер телефона"
      } else if (channel === 'email') {
        newErrors.common = "Пожалуйста, введите email"
      } else if (channel === 'telegram') {
        newErrors.common = "Пожалуйста, введите Telegram username"
      }
      setErrors(newErrors)
      return false
    }

    // Validate email format if email channel
    if (channel === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(contactValue)) {
        newErrors.common = "Пожалуйста, введите корректный email"
        setErrors(newErrors)
        return false
      }
    }

    // Validate phone format if phone/whatsapp channel
    if (channel === 'phone' || channel === 'whatsapp') {
      const digitsOnly = contactValue.replace(/\D/g, '')
      if (digitsOnly.length !== 11 || !digitsOnly.startsWith('7')) {
        newErrors.common = "Пожалуйста, введите корректный номер телефона"
        setErrors(newErrors)
        return false
      }
    }

    // Check captcha
    if (!captchaToken) {
      newErrors.common = "Подтвердите, что вы не робот."
      setErrors(newErrors)
      return false
    }

    // Prepare form data  
    const email = channel === 'email' ? contactValue : 'user@noemail.local'
    const formData: RequestFormI = {
      name: 'Пользователь',
      email: email,
      topic: '',
      question: problemText,
      agree: true,
      auth: '0'
    }

    const validResult = validateRequestForm(formData)
    
    if (validResult.is_success) {
      setSubmitting(true)
      try {
        const responseData = await submitRequestFormAction(formData, captchaToken)
        setSubmitting(false)
        setCaptchaToken(null)
        
        if (!responseData.status) {
          newErrors.common = responseData.error
          setErrors(newErrors)
          return false
        }

        // Success - show completion screen
        setIsComplete(true)
        
      } catch (error) {
        setSubmitting(false)
        newErrors.common = "Произошла ошибка при отправке. Попробуйте еще раз."
        setErrors(newErrors)
        return false
      }
    } else {
      const _errors = validResult.errors
      if (_errors !== null) {
        newErrors.common = "Проверьте правильность заполнения полей."
        for (const error of _errors) {
          if (Object.prototype.hasOwnProperty.call(newErrors, error.field)) {
            newErrors[error.field] = error.error.join('<br />')
          }
        }
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = () => {
    validateAndSubmit()
  }

  const isLastStep = step === TOTAL_VISIBLE_STEPS

  return {
    // State
    step,
    direction,
    isComplete,
    problemText,
    attachedFiles,
    complexity,
    channel,
    contactValue,
    errors,
    captchaToken,
    submitting,
    questionTouched,
    isLastStep,
    
    // Actions
    goNext,
    goBack,
    handleSubmit,
    setProblemText,
    setAttachedFiles,
    setComplexity,
    setChannel,
    setContactValue,
    setCaptchaToken,
    setQuestionTouched,
    
    // Utils
    validateQuestionText,
  }
}