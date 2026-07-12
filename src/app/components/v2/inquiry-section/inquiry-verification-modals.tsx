'use client'

import { X } from 'lucide-react'
import OtpCodeStep, { type OtpStepResult } from '@/src/app/components/forms/OtpCodeStep'
import { useBodyScrollLock } from '@/src/app/hooks/useBodyScrollLock'
import styles from './inquiry-verification-modals.module.css'

type ModalShellProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function ModalShell({ isOpen, onClose, title, children }: ModalShellProps) {
  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalBox}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className={styles.modalClose}
          aria-label="Закрыть"
        >
          <X className={styles.icon20} />
        </button>

        <h2 id="inquiry-modal-title" className={styles.modalTitle}>
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
  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalBox}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-otp-title"
      >
        <button
          type="button"
          onClick={onClose}
          className={styles.modalClose}
          aria-label="Закрыть"
        >
          <X className={styles.icon20} />
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
      <p className={styles.modalText}>
        Мы отправили заявку и письмо на{' '}
        <span className={styles.modalTextStrong}>{email}</span>.
        {' '}В письме — ваше имя, временный пароль и ссылка для подтверждения email.
        После подтверждения вы сможете войти в личный кабинет и получить ответ юриста.
      </p>
      <button type="button" onClick={onConfirm} className={styles.modalConfirmBtn}>
        Понятно
      </button>
    </ModalShell>
  )
}
