'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'

import finalCubeImg from '@/public/design/v2-main-page/progress-step4.png'

import {
  STEPS,
  CHANNEL_OPTIONS,
  TOTAL_VISIBLE_STEPS,
  type StepMeta,
  type ContactChannel,
} from './inquiry-section.data'

import {
  QUESTION_MAX_LENGTH,
} from "@/src/app/components/forms/validation/request"
import { formatPhoneInput } from "@/src/libs/phoneMask"
import { FormDataObjectT } from "@/src/interfaces/form"
import { YandexSmartCaptcha } from "@/src/app/components/forms/YandexSmartCaptcha"
import { useInquirySection } from './inquiry-section.hook'
import { useFileUpload } from './file-upload.hook'
import { InquiryEmailModal, InquiryOtpModal } from './inquiry-verification-modals'

// ─── shared sub-components ────────────────────────────────────────────────────

const VioletBtn = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center text-white text-[18px] font-medium leading-[23px] tracking-tight transition-all duration-150 hover:opacity-85 hover:shadow-lg hover:scale-105 active:scale-95 active:opacity-70 active:shadow-md shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
    style={{
      width: 348, height: 56,
      background: 'radial-gradient(circle at 50% 0%, #34347C 0%, #2D2D6C 100%)',
      border: '0.5px solid rgba(255,255,255,0.5)',
      borderRadius: 35,
    }}
  >
    {label}
  </button>
)

// ─── step panels ─────────────────────────────────────────────────────────────

function Step2Panel({ 
  value, 
  onChange, 
  files, 
  onFilesChange,
  touched,
  onBlur,
  validateQuestionText,
  errors
}: {
  value: string
  onChange: (v: string) => void
  files: File[]
  onFilesChange: (files: File[]) => void
  touched: boolean
  onBlur: () => void
  validateQuestionText: (text: string) => string | null
  errors: { question: string }
}) {
  const questionError = errors.question || validateQuestionText(value)
  const {
    fileInputRef,
    handleFileClick,
    handleFileChange,
    removeFile,
    formatFileSize,
  } = useFileUpload(files, onFilesChange)

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-[20px] font-semibold leading-6 tracking-tight text-[#12161B]">
        Кратко опишите суть проблемы
      </h3>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Например: трудовой спор, вопрос по наследству, жалоба на действия организации"
        className={`w-full resize-none text-[14px] leading-5 placeholder:text-[rgba(18,22,27,0.35)] outline-none transition-all duration-200 focus:border-[#34347C] focus:bg-white ${
          touched && questionError ? 'text-red-500 border-red-400' : 'text-[#12161B]'
        }`}
        style={{ 
          height: 110, 
          padding: '12px 16px', 
          background: '#F7F6F9', 
          border: touched && questionError ? '1.5px solid rgba(239, 68, 68, 0.5)' : '1.5px solid rgba(18,22,27,0.1)', 
          borderRadius: 20 
        }}
        maxLength={QUESTION_MAX_LENGTH}
      />
      
      {touched && questionError && (
        <div className="text-[11px] mt-1 px-1">
          <span className="text-red-400">
            {questionError}
          </span>
        </div>
      )}
      
      <div
        className="flex flex-col gap-3 cursor-pointer transition-all duration-200 hover:border-[#34347C]/60 hover:bg-[#f4f4ff] active:scale-[0.98]"
        style={{ padding: 16, background: '#F9F9F9', border: '1.5px dashed rgba(52,52,124,0.3)', borderRadius: 20 }}
        onClick={handleFileClick}
      >
        {files.length === 0 ? (
          // Empty state - show upload prompt
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mx-auto">
              <path d="M8 2v8M4 6l4-4 4 4M2 12h12" stroke="#34347C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="flex flex-col gap-0.5 text-center">
              <span className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.5)]">Прикрепите документы (необязательно)</span>
              <span className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.35)]">PDF, DOCX, JPG — до 10 МБ</span>
            </div>
          </>
        ) : (
          // Files attached - show file list inside the upload area
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium leading-[17px] text-[rgba(18,22,27,0.7)]">
                Прикрепленные файлы ({files.length}):
              </span>
              <span className="text-[11px] leading-[15px] text-[rgba(18,22,27,0.4)]">
                PDF, DOCX, JPG — до 10 МБ
              </span>
            </div>
            
            {files.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-white/60 border border-[rgba(18,22,27,0.08)] rounded-[8px] group hover:bg-white hover:border-[#34347C]/30 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center rounded bg-[rgba(52,52,124,0.1)]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M7 1H2.5A.5.5 0 002 1.5v9a.5.5 0 00.5.5h7a.5.5 0 00.5-.5V4L7 1z" stroke="#34347C" strokeWidth="0.8" fill="rgba(52,52,124,0.05)"/>
                      <path d="M7 1v3h3" stroke="#34347C" strokeWidth="0.8" fill="none"/>
                    </svg>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-[12px] font-medium leading-[16px] text-[#12161B] truncate max-w-[180px]">
                      {file.name}
                    </span>
                    <span className="text-[10px] leading-[12px] text-[rgba(18,22,27,0.5)]">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-[rgba(18,22,27,0.4)] hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M7.5 2.5L2.5 7.5M2.5 2.5l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
        />
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

// ─── channel icons ────────────────────────────────────────────────────────────

function ChannelIcon({ id, active }: { id: ContactChannel; active: boolean }) {
  const color = active ? '#fff' : '#12161B'
  if (id === 'phone') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 2h3l1.5 3.5-1.75 1.05A8.5 8.5 0 0 0 9.45 9.25L10.5 7.5 14 9v3a1 1 0 0 1-1 1A11 11 0 0 1 2 3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (id === 'whatsapp') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5A6.5 6.5 0 0 0 2.1 10.7L1.5 14.5l3.9-.6A6.5 6.5 0 1 0 8 1.5z" stroke={color} strokeWidth="1.3"/>
      <path d="M5.5 5.5c.2.5.7 1.4 1.3 2 .6.7 1.5 1.3 2 1.5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
  if (id === 'telegram') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M14 2L1 6.5l4 1.5 1.5 4.5 2-2.5 3.5 2.5L14 2z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M5 8l2 1" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke={color} strokeWidth="1.3"/>
      <path d="M1.5 5.5l6.5 4 6.5-4" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function Step5Panel({ 
  channel, 
  onChannelChange, 
  inputValue, 
  onInputChange,
  errors,
  captchaToken,
  onCaptchaChange,
  submitting
}: {
  channel: ContactChannel
  onChannelChange: (c: ContactChannel) => void
  inputValue: string
  onInputChange: (v: string) => void
  errors: FormDataObjectT
  captchaToken: string | null
  onCaptchaChange: (token: string | null) => void
  submitting: boolean
}) {
  const current = CHANNEL_OPTIONS.find(c => c.id === channel)!

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-[20px] font-semibold leading-6 tracking-tight text-[#12161B]">
          Введите контактные данные
        </h3>
        <p className="text-[14px] leading-5 text-[rgba(18,22,27,0.6)]">
          {channel === 'telegram'
            ? 'Введите Telegram, чтобы получить первую бесплатную консультацию'
            : channel === 'email'
              ? 'Введите email, чтобы получить первую бесплатную консультацию'
              : 'Введите номер телефона, чтобы получить первую бесплатную консультацию'}
        </p>
      </div>

      <div
        className="flex items-center gap-1 p-1"
        style={{ background: '#F7F6F9', border: '1px solid rgba(18,22,27,0.05)', borderRadius: 999, width: 'max-content' }}
      >
        {CHANNEL_OPTIONS.map(opt => {
          const isActive = opt.id === channel
          return (
            <button
              key={opt.id}
              onClick={() => onChannelChange(opt.id)}
              className="flex items-center justify-center gap-1.5 px-4 h-10 rounded-full text-[14px] font-medium leading-5 tracking-tight transition-all duration-150 hover:opacity-85 active:scale-95 active:opacity-70 cursor-pointer whitespace-nowrap"
              style={
                isActive
                  ? { 
                      background: 'radial-gradient(circle at 50% 0%, #34347C 0%, #2D2D6C 100%)', 
                      color: '#fff', 
                      border: '0.5px solid rgba(255,255,255,0.15)' 
                    }
                  : { 
                      color: '#12161B', 
                      border: '0.5px solid rgba(18,22,27,0.1)', 
                      background: 'transparent' 
                    }
              }
            >
              <ChannelIcon id={opt.id} active={isActive} />
              {opt.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-semibold leading-5 text-[rgba(18,22,27,0.6)]">
          {current.label}
        </label>
        <input
          key={channel}
          type={current.inputType}
          value={inputValue}
          onChange={e => {
            const newValue = e.target.value
            // Применяем форматирование только для телефонных полей
            if (channel === 'phone' || channel === 'whatsapp') {
              onInputChange(formatPhoneInput(newValue))
            } else {
              onInputChange(newValue)
            }
          }}
          placeholder={current.placeholder}
          maxLength={channel === 'phone' || channel === 'whatsapp' ? 18 : undefined}
          className={`w-full text-[14px] leading-5 placeholder:text-[rgba(18,22,27,0.35)] outline-none transition-all duration-200 focus:border-[#34347C] focus:bg-white hover:border-[rgba(18,22,27,0.25)] ${
            errors.email && channel === 'email' ? 'border-red-400 text-red-500' : 'text-[#12161B]'
          }`}
          style={{ 
            height: 48, 
            padding: '12px 16px', 
            background: '#F7F6F9', 
            border: errors.email && channel === 'email' ? '1.5px solid rgba(239, 68, 68, 0.5)' : '1.5px solid rgba(18,22,27,0.1)', 
            borderRadius: 16 
          }}
        />
        {errors.email && channel === 'email' && (
          <span className="text-[12px] text-red-400 px-1">{errors.email}</span>
        )}
      </div>

      {errors.common && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-[12px] text-red-600">{errors.common}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <YandexSmartCaptcha
          token={captchaToken}
          onChange={onCaptchaChange}
          disabled={submitting}
          variant="dark"
          fullWidth
        />
        
        <p className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.5)]">
          Нажимая «Оставить заявку», вы соглашаетесь с{' '}
          <Link href="/privacy" className="underline hover:text-[#34347C] transition-colors">политикой конфиденциальности</Link>
        </p>
      </div>
    </div>
  )
}

// ─── final screen ─────────────────────────────────────────────────────────────

function FinalScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.32, 0, 0.67, 0] }}
      className="relative flex flex-col items-center justify-center w-full min-h-[662px] gap-12 text-center overflow-hidden"
      style={{
        padding: '48px 32px',
        background: 'linear-gradient(225deg, #F0F9F3 0%, #F7F6F9 100%)',
        borderRadius: 24,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 411,
          height: 411,
          left: -79,
          top: 225,
          background: 'rgba(76, 172, 97, 0.2)',
          filter: 'blur(64px)',
        }}
      />

      <div className="relative flex flex-col items-center gap-[11px] max-w-md">
        <h2 className="text-[28px] font-semibold leading-8 tracking-tight text-[#12161B]">
          Мы работаем над вашим запросом
        </h2>
        <p className="text-[16px] leading-[22px] tracking-tight text-[rgba(18,22,27,0.6)]">
          Мы уже занимаемся вашим делом. Получите ответ в{' '}
          <Link href="/profile/" className="underline text-[#34347C] hover:opacity-80 transition-opacity">
            личном кабинете
          </Link>
          {' '}или дождитесь уведомления о готовности
        </p>
      </div>

      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, type: 'spring', bounce: 0.4 }}
        className="relative z-[1]"
        style={{ width: 264, height: 248 }}
      >
        <Image
          src={finalCubeImg}
          alt="Запрос принят"
          fill
          className="object-contain"
        />
      </motion.div>
    </motion.div>
  )
}

// ─── step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center w-full">
        {Array.from({ length: TOTAL_VISIBLE_STEPS }).map((_, i) => {
          const stepNum = i + 1
          const completed = stepNum < current
          const active   = stepNum === current
          const isLast = i === TOTAL_VISIBLE_STEPS - 1
          
          return (
            <div key={stepNum} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              <div
                className="w-10 h-10 flex items-center justify-center rounded-full text-[18px] font-medium shrink-0 transition-all duration-300"
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
                  className="h-0.5 rounded-full transition-all duration-500 flex-1 ml-2 mr-2"
                  style={{ background: completed ? 'linear-gradient(135deg, #34347C 0%, #34537C 100%)' : 'rgba(18,22,27,0.15)' }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[14px] font-semibold leading-5 text-[#34347C]">Шаг {current} из {TOTAL_VISIBLE_STEPS}</span>
        <span className="text-[14px] leading-5 text-[rgba(48,48,115,0.75)]">· {STEPS[current - 1]?.label}</span>
      </div>
    </div>
  )
}

// ─── animated progress panel ──────────────────────────────────────────────────

function ProgressPanel({ step, direction }: { step: number; direction: number }) {
  const meta = STEPS[step - 1] as StepMeta
  const displayProgress = step === 1 ? 20 : meta.progress
  const isLastStep = step === TOTAL_VISIBLE_STEPS

  return (
    <div className="flex flex-col gap-8 flex-1 overflow-hidden" style={{ padding: '24px 64px' }}>
      <div className="flex flex-col gap-2 pb-2">
        <h3 className="text-[28px] font-semibold leading-8 tracking-tight text-[#12161B]">
          {isLastStep ? 'Уже готовим ответ' : 'Ваше дело собирается'}
        </h3>
        <p className="text-[16px] leading-[22px] tracking-tight text-[rgba(18,22,27,0.6)]">
          {isLastStep ? 'Мы уже получили ваш вопрос' : 'Мы подготовим предварительные рекомендации'}
        </p>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ y: direction > 0 ? -60 : 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction > 0 ? 60 : -60, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0, 0.67, 0] }}
            className="absolute inset-0"
          >
            <Image src={meta.image} alt={`Step ${step} illustration`} fill className="object-contain object-center" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[16px] leading-[22px] tracking-tight text-[rgba(18,22,27,0.6)]">Готовность анализа</p>
        <div className="flex items-center justify-between">
          <motion.span
            key={`pct-${step}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-[48px] font-semibold leading-[56px] tracking-tight"
            style={{ background: 'radial-gradient(circle at 50% 0%, #34347C 0%, #2D2D6C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {displayProgress}%
          </motion.span>
          <div style={{ width: 280 }}>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: 'rgba(18,22,27,0.05)' }}>
              <motion.div
                className="h-full rounded-full"
                initial={false}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                style={{ background: 'linear-gradient(90deg, #2654C0 0%, #34347C 100%)', boxShadow: '0px 0px 12px 0px rgba(92,122,240,0.4)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export function InquirySection() {
  const {
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
  } = useInquirySection()

  return (
    <section
      id="inquiry"
      className="relative -mt-14 w-full"
      style={{ background: '#F9F9F9', borderRadius: '52px 52px 0 0', padding: '80px 0 56px' }}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-[100px]">
        <div
          className="flex w-full"
        style={{
          minHeight: 662,
          background: '#F7F6F9',
          border: '1px solid rgba(18,22,27,0.05)',
          borderRadius: 24,
          boxShadow: '0px 3px 36px 0px rgba(0,0,0,0.04), 0px -102px 250px 0px rgba(0,0,0,0.07)',
        }}
      >
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="final"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full min-h-[662px] flex"
            >
              <FinalScreen />
            </motion.div>
          ) : (
            <motion.div key="quiz" className="flex w-full min-h-full" initial={false}>
              <div
                className="flex flex-col justify-between shrink-0"
                style={{ width: 720, background: '#fff', padding: '24px 32px', borderRadius: 24 }}
              >
                <div className="flex flex-col gap-12">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                      <h2 className="text-[28px] font-semibold leading-8 tracking-tight text-[#12161B]">Получите  юридическое заключение бесплатно</h2>
                      <p className="text-[16px] leading-[22px] tracking-tight text-[rgba(18,22,27,0.6)]">
                        Опишите вашу ситуацию и мы подготовим ответ в течение 3 часов
                      </p>
                    </div>
                    <StepIndicator current={step} />
                  </div>

                  <div className="relative" style={{ minHeight: step === 1 ? 320 : 260 }}>
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={step}
                        custom={direction}
                        initial={{ x: direction > 0 ? 40 : -40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: direction > 0 ? -40 : 40, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        {step === 1 && (
                          <Step2Panel 
                            value={problemText} 
                            onChange={setProblemText}
                            files={attachedFiles}
                            onFilesChange={setAttachedFiles}
                            touched={questionTouched}
                            onBlur={() => setQuestionTouched(true)}
                            validateQuestionText={validateQuestionText}
                            errors={{ question: typeof errors.question === 'string' ? errors.question : '' }}
                          />
                        )}
                        {step === 2 && (
                          <Step5Panel
                            channel={channel}
                            onChannelChange={setChannel}
                            inputValue={contactValue}
                            onInputChange={setContactValue}
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
                            captchaToken={captchaToken}
                            onCaptchaChange={setCaptchaToken}
                            submitting={submitting}
                          />
                        )}
                        */}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-6" style={{ width: 656 }}>
                  {isLastStep && typeof errors.common === 'string' && errors.common && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-[12px] text-red-600">{errors.common}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={goBack}
                    className="text-[18px] font-medium leading-[23px] tracking-tight text-[rgba(18,22,27,0.6)] transition-opacity hover:opacity-70 active:opacity-40 cursor-pointer"
                    style={{ width: 120, paddingBlock: 17, visibility: step > 1 ? 'visible' : 'hidden' }}
                  >
                    Назад
                  </button>
                  {isLastStep
                    ? <VioletBtn label={submitting ? "Подтверждаем..." : "Подтвердить"} onClick={handleSubmit} disabled={submitting} />
                    : <VioletBtn label="Далее" onClick={goNext} />
                  }
                  </div>
                </div>
              </div>

              <ProgressPanel step={step} direction={direction} />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      <InquiryOtpModal
        isOpen={verificationModal === 'otp'}
        phone={contactValue}
        onClose={closeVerificationModal}
        onVerify={handleOtpVerify}
        onResend={handleOtpResend}
      />

      <InquiryEmailModal
        isOpen={verificationModal === 'email'}
        email={pendingEmail}
        onConfirm={confirmEmailModal}
      />
    </section>
  )
}
