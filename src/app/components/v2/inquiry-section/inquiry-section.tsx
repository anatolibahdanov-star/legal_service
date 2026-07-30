'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'motion/react'
import { Clock, FileText, Globe } from 'lucide-react'

import { isStaffRole } from '@/src/app/components/v2/lawyer-requests/staff-gate'

import finalCubeImg from '@/public/design/v2-main-page/progress-final.png'
import inquiryCubeImg from '@/public/design/v2-main-page/inquiry-cube-mobile.png'

import {
  STEPS,
  TOTAL_VISIBLE_STEPS,
  type StepMeta,
} from './inquiry-section.data'

import {
  QUESTION_MAX_LENGTH,
} from "@/src/app/components/forms/validation/request"
import { formatPhoneInput, PHONE_MASK_TEMPLATE } from "@/src/libs/phoneMask"
import { FormDataObjectT } from "@/src/interfaces/form"
import {
  LegalConsents,
  type LegalConsentsValue,
} from '@/src/app/components/LegalConsents'
import { YandexSmartCaptcha } from "@/src/app/components/forms/YandexSmartCaptcha"
import { useInquirySection, type InquiryPanel } from './inquiry-section.hook'
import { InquiryOtpModal } from './inquiry-verification-modals'
import { type VerificationModal } from './inquiry-section.verify'
import RequestStepProfile from '@/src/app/components/forms/RequestStepProfile'
import RequestStepPayment from '@/src/app/components/forms/RequestStepPayment'
import type { SuccessVariant } from '@/src/app/components/forms/RequestStepSuccess'
import styles from './inquiry-section.module.css'

// ─── shared sub-components ────────────────────────────────────────────────────

const PILLS = [
  { icon: FileText, label: '2 шага' },
  { icon: Clock, label: '3 часа' },
  { icon: Globe, label: 'Онлайн' },
]

const VioletBtn = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={styles.violetBtn}
  >
    {label}
  </button>
)

// ─── step panels ─────────────────────────────────────────────────────────────

function Step2Panel({ 
  value, 
  onChange, 
  touched,
  onBlur,
  validateQuestionText,
  errors
}: {
  value: string
  onChange: (v: string) => void
  touched: boolean
  onBlur: () => void
  validateQuestionText: (text: string) => string | null
  errors: { question: string }
}) {
  const questionError = errors.question || validateQuestionText(value)

  return (
    <div className={styles.colGap6}>
      <h3 className={styles.stepHeading}>
        Кратко опишите суть проблемы
      </h3>
      <p className={styles.stepHint}>
        Опишите ситуацию или юридический вопрос в свободной форме. Лучше всего
        задачу структурировать по шагам: дата, участники, что произошло, какие
        документы подписаны или какие меры предпринимались. Сформулируйте
        вопрос, на который надо ответить (например: оценить юридические риски,
        предложить стратегию действий, разъяснить правовые последствия и тп.)
      </p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Опишите ситуацию или задайте вопрос…"
        className={`${styles.textarea} ${touched && questionError ? styles.textareaError : ''}`}
        maxLength={QUESTION_MAX_LENGTH}
      />

      {touched && questionError && (
        <div className={styles.fieldErrorWrap}>
          <span className={styles.errorText}>
            {questionError}
          </span>
        </div>
      )}

      {/* Upload UI kept for layout; interaction disabled until attachments ship. */}
      <div
        aria-disabled="true"
        className="flex flex-col gap-3 opacity-60 cursor-not-allowed select-none"
        style={{ padding: 16, background: '#F9F9F9', border: '1.5px dashed rgba(52,52,124,0.3)', borderRadius: 20 }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mx-auto" aria-hidden>
          <path d="M8 2v8M4 6l4-4 4 4M2 12h12" stroke="#34347C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="flex flex-col gap-0.5 text-center">
          <span className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.5)]">Прикрепите документы (необязательно)</span>
          <span className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.35)]">PDF, DOCX, JPG — до 10 МБ</span>
        </div>
      </div>
    </div>
  )
}

/*
function StepCategoryPanel({ value, onChange, errors }: {
  value: string
  onChange: (v: string) => void
  errors: { common: string }
}) {
  return (
    <div className="flex flex-col gap-4" style={{ flex: 1 }}>
      <h3 className="text-[20px] font-semibold leading-6 tracking-tight text-[#12161B]">
        Выберите категорию вашего вопроса
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map(cat => {
          const isSelected = value === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              className="box-border flex flex-col items-start gap-3 rounded-2xl text-left cursor-pointer transition-[background-color,border-color,box-shadow] duration-150 hover:brightness-[0.98]"
              style={{
                padding: '16px',
                height: 108,
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(153,153,202,0.15) 0%, rgba(165,165,221,0.15) 100%)'
                  : '#FFFFFF',
                border: `1.5px solid ${isSelected ? '#34347C' : 'rgba(18,22,27,0.08)'}`,
                boxShadow: isSelected
                  ? '0px 4px 20px 0px rgba(47,47,113,0.12)'
                  : '0px 4px 20px 0px transparent',
              }}
            >
              <div
                className="flex items-center justify-center shrink-0 rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  background: isSelected ? '#34347C' : 'rgba(153,153,202,0.15)',
                }}
              >
                <Image
                  src={cat.icon}
                  alt=""
                  width={20}
                  height={20}
                  className={`shrink-0 ${isSelected ? 'brightness-0 invert' : ''}`}
                />
              </div>
              <span
                className="text-[14px] font-medium leading-[18px] tracking-tight"
                style={{ color: isSelected ? '#34347C' : '#12161B' }}
              >
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>
      {errors.common && (
        <div className="text-[12px] mt-2 px-1">
          <span className="text-red-400">{errors.common}</span>
        </div>
      )}
    </div>
  )
}
*/

/*
function StepComplexityPanel({ value, onChange, errors }: {
  value: string
  onChange: (v: string) => void
  errors: { common: string }
}) {
  return (
    <div className="flex flex-col gap-4" style={{ flex: 1 }}>
      <div className="flex flex-col gap-2">
        <h3 className="text-[20px] font-semibold leading-6 tracking-tight text-[#12161B]">Оцените сложность вашей ситуации</h3>
        <p className="text-[14px] leading-5 text-[rgba(18,22,27,0.6)]">Это поможет подобрать юриста с нужным опытом</p>
      </div>
      <div className="flex gap-3 flex-1">
        {COMPLEXITY.map(c => {
          const isSelected = value === c.id
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              className="flex flex-col justify-center items-center gap-3 flex-1 rounded-2xl transition-all duration-150 hover:brightness-95 active:scale-95 active:opacity-80 cursor-pointer text-center"
              style={{
                padding: 20,
                background: isSelected ? 'linear-gradient(135deg, rgba(153,153,202,0.15) 0%, rgba(165,165,221,0.15) 100%)' : '#F9F9F9',
                border: isSelected ? '1.5px solid #34347C' : '1px solid rgba(18,22,27,0.05)',
                boxShadow: isSelected ? '0px 4px 20px 0px rgba(47,47,113,0.15)' : undefined,
              }}
            >
              <div className="flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: 999, background: c.dots[i]?.color ?? 'rgba(18,22,27,0.05)' }} />
                ))}
              </div>
              <span className="text-[22px] font-semibold leading-7 tracking-tight" style={{ color: isSelected ? '#34347C' : '#12161B' }}>{c.title}</span>
              <span className="text-[12px] leading-[17px]" style={{ color: isSelected ? 'rgba(52,52,124,0.6)' : 'rgba(18,22,27,0.5)' }}>{c.sub}</span>
            </button>
          )
        })}
      </div>
      {errors.common && (
        <div className="text-[12px] mt-2 px-1">
          <span className="text-red-400">
            {errors.common}
          </span>
        </div>
      )}
    </div>
  )
}
*/

// ─── contact step (phone only) ────────────────────────────────────────────────

function Step5Panel({
  inputValue,
  onInputChange,
  consents,
  onConsentsChange,
  consentErrors,
  errors,
  captchaToken,
  onCaptchaChange,
  submitting,
}: {
  inputValue: string
  onInputChange: (v: string) => void
  consents: LegalConsentsValue
  onConsentsChange: (v: LegalConsentsValue) => void
  consentErrors: Partial<Record<keyof LegalConsentsValue, string>>
  errors: FormDataObjectT
  captchaToken: string | null
  onCaptchaChange: (token: string | null) => void
  submitting: boolean
}) {
  return (
    <div className={styles.colGap6}>
      <div className={styles.colGap1}>
        <h3 className={styles.stepHeading}>
          Введите номер телефона
        </h3>
        <p className={styles.stepSubtext}>
          Отправим код подтверждения в SMS. После проверки укажите email для ответа юриста.
        </p>
      </div>

      <div className={styles.colGap1_5}>
        <label className={styles.fieldLabel}>Телефон</label>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={inputValue}
          onChange={e => onInputChange(formatPhoneInput(e.target.value))}
          placeholder={PHONE_MASK_TEMPLATE}
          maxLength={18}
          className={styles.textInput}
        />
      </div>

      {errors.common && (
        <div className={styles.errorBox}>
          <p className={styles.errorBoxText}>{errors.common}</p>
        </div>
      )}

      <div className={styles.colGap3}>
        <YandexSmartCaptcha
          token={captchaToken}
          onChange={onCaptchaChange}
          disabled={submitting}
          variant="light"
          fullWidth
        />

        <LegalConsents
          value={consents}
          onChange={onConsentsChange}
          tone="light"
          errors={consentErrors}
          idPrefix="inquiry-consent"
        />
      </div>
    </div>
  )
}

// ─── final screen ─────────────────────────────────────────────────────────────

function FinalScreen({ onAskAnother, kind = 'free' }: { onAskAnother: () => void; kind?: SuccessVariant }) {
  const isPayLater = kind === 'later'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.32, 0, 0.67, 0] }}
      className={styles.finalScreen}
    >
      <div aria-hidden className={styles.finalBlur} />

      <div className={styles.finalInner}>
        <h2 className={styles.title28}>
          {isPayLater ? 'Ваш вопрос сохранён' : 'Мы работаем над вашим запросом'}
        </h2>
        <p className={styles.text16}>
          {isPayLater ? (
            <>
              Вопрос сохранён, но пока не оплачен. Оплатите его в{' '}
              <Link href="/profile/?tab=cases" className={styles.finalLink}>
                личном кабинете
              </Link>
              {' '}в разделе «Ваши заявки», чтобы юрист приступил к работе
            </>
          ) : (
            <>
              Мы уже занимаемся вашим делом. Получите ответ в{' '}
              <Link href="/profile/?tab=cases" className={styles.finalLink}>
                личном кабинете
              </Link>
              {' '}или дождитесь уведомления о готовности
            </>
          )}
        </p>
        <button
          type="button"
          onClick={onAskAnother}
          className={styles.finalAskBtn}
        >
          Хотите задать ещё один вопрос?
        </button>
      </div>

      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, type: 'spring', bounce: 0.4 }}
        className={styles.finalImageWrap}
      >
        <Image
          src={finalCubeImg}
          alt="Запрос принят"
          fill
          className={styles.containImage}
        />
      </motion.div>
    </motion.div>
  )
}

// ─── step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className={styles.colGap4}>
      <div className={styles.stepIndicatorRow}>
        {Array.from({ length: TOTAL_VISIBLE_STEPS }).map((_, i) => {
          const stepNum = i + 1
          const completed = stepNum < current
          const active   = stepNum === current
          const isLast = i === TOTAL_VISIBLE_STEPS - 1
          
          return (
            <div key={stepNum} className={`${styles.stepIndicatorItem} ${isLast ? '' : styles.flex1}`}>
              <div
                className={styles.stepCircle}
                style={
                  completed || active
                    ? { background: 'radial-gradient(circle at 50% 0%, #34347C 0%, #2D2D6C 100%)', border: '0.5px solid rgba(255,255,255,0.15)', color: '#fff', boxShadow: active ? '0 0 0 4px rgba(123,92,240,0.12)' : undefined }
                    : { border: '1px solid rgba(18,22,27,0.15)', color: 'rgba(18,22,27,0.6)' }
                }
              >
                {completed
                  ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : stepNum
                }
              </div>
              {!isLast && (
                <div
                  className={styles.stepConnector}
                  style={{ background: completed ? 'linear-gradient(135deg, #34347C 0%, #34537C 100%)' : 'rgba(18,22,27,0.15)' }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className={styles.rowGap1}>
        <span className={styles.stepLabelActive}>Шаг {current} из {TOTAL_VISIBLE_STEPS}</span>
        <span className={styles.stepLabelMuted}>· {STEPS[current - 1]?.label}</span>
      </div>
    </div>
  )
}

// ─── animated progress panel ──────────────────────────────────────────────────

function ProgressPanel({
  step,
  direction,
  panel,
  verificationModal,
}: {
  step: number
  direction: number
  panel: InquiryPanel
  verificationModal: VerificationModal
}) {
  const meta = STEPS[step - 1] as StepMeta
  // Progress reflects what the user has already completed, not the current
  // step: 0% while filling in the question, 20% once it's submitted and the
  // phone step is shown, 40% while confirming the OTP code, 60% once verified
  // (profile/payment step).
  const displayProgress =
    panel === 'profile' || panel === 'payment'
      ? 60
      : verificationModal === 'otp'
        ? 40
        : step >= 2
          ? 20
          : 0
  const isLastStep = step === TOTAL_VISIBLE_STEPS

  return (
    <div className={styles.progressPanel}>
      <div className={styles.progressHeader}>
        <h3 className={styles.title28}>
          {isLastStep ? 'Уже готовим ответ' : 'Ваше дело собирается'}
        </h3>
        <p className={styles.text16}>
          {isLastStep ? 'Мы уже получили ваш вопрос' : 'Мы подготовим предварительные рекомендации'}
        </p>
      </div>

      <div className={styles.progressImageBox}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ y: direction > 0 ? -60 : 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction > 0 ? 60 : -60, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0, 0.67, 0] }}
            className={styles.absoluteInset}
          >
            <Image src={meta.image} alt={`Step ${step} illustration`} fill className={styles.containImageCenter} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.colGap2}>
        <p className={styles.text16}>Готовность анализа</p>
        <div className={styles.rowBetween}>
          <motion.span
            key={`pct-${step}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={styles.progressPct}
          >
            {displayProgress}%
          </motion.span>
          <div className={styles.progressBarWrap}>
            <div className={styles.progressBarTrack}>
              <motion.div
                className={styles.progressBarFill}
                initial={false}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function InquirySection({
  variant = 'page',
  onClose,
  onCreated,
}: {
  variant?: 'page' | 'inline'
  onClose?: () => void
  onCreated?: (question: { id: string | number; uuid: string | null }) => void
} = {}) {
  const { data: session, status: sessionStatus } = useSession()
  const isStaff = isStaffRole(session?.user?.role)
  const isEmbedded = variant === 'inline'
  const [showQuizMobile, setShowQuizMobile] = useState(false)
  const {
    step,
    direction,
    panel,
    isComplete,
    problemText,
    contactValue,
    consents,
    consentErrors,
    errors,
    submitting,
    captchaToken,
    questionTouched,
    isLastStep,
    isAuthed,
    isSessionLoading,
    verificationModal,
    profileInitialName,
    profileInitialEmail,
    questionPrice,
    userBalance,
    freeQuestions,
    successKind,
    goNext,
    goBack,
    handleSubmit,
    closeVerificationModal,
    handleOtpVerify,
    handleOtpResend,
    handleProfileSubmit,
    handleProfileContinue,
    handlePayCard,
    handlePayBalance,
    handlePayLater,
    goToBalance,
    resetForm,
    setProblemText,
    setContactValue,
    setConsents,
    setCaptchaToken,
    setQuestionTouched,
    validateQuestionText,
  } = useInquirySection({ isProfile: isEmbedded, onCreated })

  const effectiveClose = isEmbedded ? onClose : () => setShowQuizMobile(false)

  if (sessionStatus !== 'loading' && isStaff) {
    if (isEmbedded) return null
    const cabinetHref =
      session?.user?.role === 'admin' ? '/admin#/requests' : '/admin/requests'
    return (
      <section id="inquiry" className={styles.inquirySection}>
        <div className={styles.inquiryContainer}>
          <div className={styles.staffBlocked}>
            <p className={styles.staffBlockedText}>
              Создание обращений недоступно для сотрудников. Работайте с заявками в личном кабинете.
            </p>
            <Link href={cabinetHref} className={styles.staffBlockedLink}>
              Перейти к заявкам
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const wizardCard = (
    <div className={styles.inquiryCard}>
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="final"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.wizardFinalWrap}
            >
              <FinalScreen onAskAnother={resetForm} kind={successKind} />
            </motion.div>
          ) : panel === 'success' ? (
            <motion.div
              key="wizard-success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.wizardFinalWrap}
            >
              <FinalScreen onAskAnother={resetForm} kind={successKind} />
            </motion.div>
          ) : (
            <motion.div key="quiz" className={styles.wizardQuiz} initial={false}>
              <div className={styles.wizardLeft}>
                <div className={styles.colGap12}>
                  <div className={styles.colGap6}>
                    <div className={styles.colGap3}>
                      <h2 className={styles.title28}>
                        {isEmbedded
                          ? 'Получите юридическое заключение'
                          : 'Получите юридическое заключение бесплатно'}
                      </h2>
                      <p className={styles.text16}>
                        Опишите вашу ситуацию и мы подготовим ответ в течение 3 часов
                      </p>
                    </div>
                    <StepIndicator current={step} />
                  </div>

                  <div className={`${styles.relativeBox} ${styles.panelBox} ${step === 1 ? styles.panelBoxStep1 : ''}`}>
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={step}
                        custom={direction}
                        initial={{ x: direction > 0 ? 40 : -40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: direction > 0 ? -40 : 40, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        {panel === 'profile' && (
                          <RequestStepProfile
                            variant="v2"
                            initialName={profileInitialName}
                            initialEmail={profileInitialEmail}
                            onSubmit={handleProfileSubmit}
                            onContinue={handleProfileContinue}
                          />
                        )}
                        {panel === 'payment' && (
                          <RequestStepPayment
                            variant="v2"
                            price={questionPrice}
                            balance={userBalance}
                            freeQuestions={freeQuestions}
                            onPayCard={handlePayCard}
                            onPayBalance={handlePayBalance}
                            onPayLater={handlePayLater}
                            onTopUp={goToBalance}
                          />
                        )}
                        {panel === 'quiz' && step === 1 && (
                          <Step2Panel 
                            value={problemText} 
                            onChange={setProblemText}
                            touched={questionTouched}
                            onBlur={() => setQuestionTouched(true)}
                            validateQuestionText={validateQuestionText}
                            errors={{ question: typeof errors.question === 'string' ? errors.question : '' }}
                          />
                        )}
                        {panel === 'quiz' && step === 2 && (
                          <Step5Panel
                            inputValue={contactValue}
                            onInputChange={setContactValue}
                            consents={consents}
                            onConsentsChange={setConsents}
                            consentErrors={consentErrors}
                            errors={errors}
                            captchaToken={captchaToken}
                            onCaptchaChange={setCaptchaToken}
                            submitting={submitting}
                          />
                        )}
                        {/*
                        {step === 2 && (
                          <StepCategoryPanel
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            errors={{ common: typeof errors.common === 'string' ? errors.common : '' }}
                          />
                        )}
                        {step === 3 && (
                          <Step5Panel
                            channel={channel}
                            onChannelChange={setChannel}
                            inputValue={contactValue}
                            onInputChange={setContactValue}
                            errors={errors}
                          />
                        )}
                        */}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {panel === 'quiz' && (
                <div className={styles.wizardNav}>
                  <div className={styles.wizardNavRow}>
                  <button
                    onClick={step > 1 ? goBack : (effectiveClose ?? goBack)}
                    className={`${styles.backBtn} ${!isEmbedded && step === 1 ? styles.closeDesktopHidden : ''}`}
                    style={
                      isEmbedded
                        ? { width: 120, paddingBlock: 17, visibility: step > 1 || onClose ? 'visible' : 'hidden' }
                        : { width: 120, paddingBlock: 17 }
                    }
                  >
                    {step > 1 ? 'Назад' : 'Закрыть'}
                  </button>
                  {isLastStep
                    ? <VioletBtn label={submitting ? "Подтверждаем..." : "Подтвердить"} onClick={handleSubmit} disabled={submitting || isSessionLoading} />
                    : <VioletBtn
                        label={submitting ? "Обрабатываем..." : isAuthed ? "Отправить" : "Далее"}
                        onClick={goNext}
                        disabled={submitting || isSessionLoading}
                      />
                  }
                  </div>
                </div>
                )}
              </div>

              <ProgressPanel step={step} direction={direction} panel={panel} verificationModal={verificationModal} />
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  )

  const modals = (
    <>
      <InquiryOtpModal
        isOpen={verificationModal === 'otp'}
        phone={contactValue}
        onClose={closeVerificationModal}
        onVerify={handleOtpVerify}
        onResend={handleOtpResend}
      />
    </>
  )

  if (isEmbedded) {
    return (
      <section className={styles.inquirySectionEmbedded}>
        <div className={styles.inquiryContainerEmbedded}>{wizardCard}</div>
        {modals}
      </section>
    )
  }

  return (
    <section id="inquiry" className={styles.inquirySection}>
      <div className={styles.inquiryContainer}>
        {!showQuizMobile && (
          <div className={styles.ctaMobile}>
            <div className={styles.ctaCard}>
              <div className={styles.ctaContent}>
                <h2 className={styles.ctaTitle}>Получите юридическое заключение бесплатно</h2>
                <div className={styles.ctaDetails}>
                  <div className={styles.ctaSteps}>
                    <p className={styles.ctaText}>
                      Опишите вашу ситуацию и мы подготовим ответ в течение 3 часов
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowQuizMobile(true)}
                      className={styles.ctaBtn}
                    >
                      Начать консультацию
                    </button>
                  </div>
                </div>
              </div>
              <div className={styles.ctaCubeWrap} aria-hidden>
                <Image
                  src={inquiryCubeImg}
                  alt=""
                  width={140}
                  height={172}
                  priority
                  unoptimized
                  className={styles.ctaCube}
                />
              </div>
            </div>

            {/* <div className={styles.pills}>
              {PILLS.map(({ icon: Icon, label }) => (
                <div key={label} className={styles.pill}>
                  <Icon className={styles.pillIcon} strokeWidth={1.6} />
                  <span className={styles.pillLabel}>{label}</span>
                </div>
              ))}
            </div> */}
          </div>
        )}

        <div className={showQuizMobile ? styles.wizardShown : styles.wizardDesktopOnly}>
          {wizardCard}
        </div>
      </div>
      {modals}
    </section>
  )
}
