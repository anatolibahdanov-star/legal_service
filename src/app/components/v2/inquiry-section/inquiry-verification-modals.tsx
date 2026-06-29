'use client'

import { X } from 'lucide-react'
import OtpCodeStep, { type OtpStepResult } from '@/src/app/components/forms/OtpCodeStep'

type ModalShellProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function ModalShell({ isOpen, onClose, title, children }: ModalShellProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[200]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] p-8 w-full max-w-[520px] relative max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[rgba(18,22,27,0.6)] hover:text-[#12161B] hover:bg-[#F7F6F9] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <h2
          id="inquiry-modal-title"
          className="text-[26px] font-semibold leading-8 tracking-tight text-[#12161B] mb-2 pr-8"
        >
          {title}
        </h2>

        {children}
      </div>
    </div>
  )
}

type InquiryOtpModalProps = {
  isOpen: boolean
  phone: string
  onClose: () => void
  onVerify: (code: string) => Promise<OtpStepResult>
  onResend: () => Promise<OtpStepResult>
}

export function InquiryOtpModal({
  isOpen,
  phone,
  onClose,
  onVerify,
  onResend,
}: InquiryOtpModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[200]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] p-8 w-full max-w-[520px] relative max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-otp-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[rgba(18,22,27,0.6)] hover:text-[#12161B] hover:bg-[#F7F6F9] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        <OtpCodeStep
          phone={phone}
          onVerify={onVerify}
          onResend={onResend}
          onChangePhone={onClose}
        />
      </div>
    </div>
  )
}

type InquiryEmailModalProps = {
  isOpen: boolean
  email: string
  onConfirm: () => void
}

export function InquiryEmailModal({ isOpen, email, onConfirm }: InquiryEmailModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onConfirm} title="Проверьте почту">
      <p className="text-[14px] leading-[22px] text-[rgba(18,22,27,0.6)] mb-6">
        Мы отправили заявку и письмо на{' '}
        <span className="font-semibold text-[#12161B]">{email}</span>.
        {' '}Перейдите по ссылке в письме, чтобы подтвердить email и получить ответ в личном кабинете.
      </p>
      <button
        type="button"
        onClick={onConfirm}
        className="w-full h-[52px] rounded-[35px] text-[16px] font-medium text-white transition-opacity hover:opacity-90"
        style={{
          background: 'radial-gradient(circle at 50% 0%, #34347C 0%, #2D2D6C 100%)',
        }}
      >
        Понятно
      </button>
    </ModalShell>
  )
}
