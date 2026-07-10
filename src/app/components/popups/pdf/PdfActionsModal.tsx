'use client'

import { useEffect, useState } from 'react'
import {
  Download,
  Eye,
  MessageSquare,
  Mail,
  Link2,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/src/app/components/ui/dialog'
import { Input } from '@/src/app/components/ui/input'
import { cn } from '@/src/app/components/ui/utils'
import { formatPhoneInput, isPhoneComplete } from '@/src/libs/phoneMask'
import styles from './pdf-actions-modal.module.css'

type DownloadStatus = 'idle' | 'generating' | 'loading' | 'success' | 'error'
type SendStatus = 'idle' | 'loading' | 'success' | 'error'
type Panel = 'menu' | 'sms' | 'email'

export type PdfShareChannel = 'sms' | 'email'

export interface PdfActionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  questionId: string | number
  questionUuid?: string
  questionDate?: string
  questionText?: string
  /** True if the PDF is already generated — drives "Генерируем…" vs "Загружаем…" label. */
  hasPdf?: boolean
  defaultPhone?: string
  defaultEmail?: string
  /** Public, non-expiring PDF link used for the "copy link" action. */
  shareLink: string
  onDownload?: () => Promise<void>
  onPreview?: () => Promise<void> | void
  onSendSms?: (phoneE164: string) => Promise<void>
  onSendEmail?: (email: string) => Promise<void>
  /**
   * Called when the user clicks "copy link". When provided, this is the
   * authoritative source of the share URL — the modal will await it, copy
   * the returned string to the clipboard, and ignore `shareLink`.
   */
  onCopyLink?: () => Promise<string>
  /** Fired after a successful share so the parent can open the success modal. */
  onShareSuccess?: (channel: PdfShareChannel, target: string) => void
}

export function PdfActionsModal({
  open,
  onOpenChange,
  questionId,
  questionDate,
  questionText,
  hasPdf = false,
  defaultPhone = '',
  defaultEmail = '',
  shareLink,
  onDownload,
  onPreview,
  onSendSms,
  onSendEmail,
  onCopyLink,
  onShareSuccess,
}: PdfActionsModalProps) {
  const [panel, setPanel] = useState<Panel>('menu')
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('idle')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')

  const [phoneInput, setPhoneInput] = useState(formatPhoneInput(defaultPhone))
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [smsStatus, setSmsStatus] = useState<SendStatus>('idle')

  const [email, setEmail] = useState(defaultEmail)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<SendStatus>('idle')

  const isDownloadBusy =
    downloadStatus === 'loading' || downloadStatus === 'generating'

  useEffect(() => {
    if (open) return
    const t = setTimeout(() => {
      setPanel('menu')
      setDownloadStatus('idle')
      setPreviewLoading(false)
      setCopyStatus('idle')
      setSmsStatus('idle')
      setEmailStatus('idle')
      setPhoneError(null)
      setEmailError(null)
    }, 200)
    return () => clearTimeout(t)
  }, [open])

  async function handleDownload() {
    if (isDownloadBusy) return
    setDownloadStatus(hasPdf ? 'loading' : 'generating')
    try {
      if (onDownload) {
        await onDownload()
      } else {
        await wait(hasPdf ? 600 : 1500)
      }
      setDownloadStatus('success')
      setTimeout(() => setDownloadStatus('idle'), 1500)
    } catch (err) {
      console.error('PdfActionsModal handleDownload', err)
      setDownloadStatus('error')
      setTimeout(() => setDownloadStatus('idle'), 2000)
    }
  }

  async function handlePreview() {
    setPreviewLoading(true)
    try {
      if (onPreview) {
        await onPreview()
      } else {
        await wait(200)
        if (typeof window !== 'undefined') {
          window.open(shareLink, '_blank', 'noopener,noreferrer')
        }
      }
    } catch (err) {
      console.error('PdfActionsModal handlePreview', err)
    } finally {
      setTimeout(() => setPreviewLoading(false), 400)
    }
  }

  async function handleCopyLink() {
    try {
      const url = onCopyLink ? await onCopyLink() : shareLink
      if (!url) throw new Error('No share URL available')
      await navigator.clipboard.writeText(url)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (err) {
      console.error('PdfActionsModal handleCopyLink', err)
    }
  }

  async function handleSendSms() {
    if (!isPhoneComplete(phoneInput)) {
      setPhoneError('Введите номер целиком')
      return
    }
    setPhoneError(null)
    setSmsStatus('loading')
    const phoneE164 = '+' + phoneInput.replace(/\D/g, '')
    try {
      if (onSendSms) {
        await onSendSms(phoneE164)
      } else {
        await wait(800)
      }
      setSmsStatus('success')
      onShareSuccess?.('sms', phoneE164)
    } catch (err) {
      console.error('PdfActionsModal handleSendSms', err)
      setSmsStatus('error')
      setPhoneError('Не удалось отправить SMS. Попробуйте позже.')
    }
  }

  async function handleSendEmail() {
    if (!isValidEmail(email)) {
      setEmailError('Введите корректный email')
      return
    }
    setEmailError(null)
    setEmailStatus('loading')
    try {
      if (onSendEmail) {
        await onSendEmail(email)
      } else {
        await wait(800)
      }
      setEmailStatus('success')
      onShareSuccess?.('email', email)
    } catch (err) {
      console.error('PdfActionsModal handleSendEmail', err)
      setEmailStatus('error')
      setEmailError('Не удалось отправить email. Попробуйте позже.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          '!flex !max-w-[400px] !flex-col !gap-0 !overflow-hidden !rounded-[28px] !border !border-[rgba(18,22,27,0.05)] !bg-white !p-0',
          'shadow-[0_3px_36px_0_rgba(0,0,0,0.04),0_-102px_250px_0_rgba(0,0,0,0.07)]',
          '[&>button]:top-[18px] [&>button]:right-[18px] [&>button]:rounded-full [&>button]:p-2',
          '[&>button]:opacity-100 [&>button]:text-[rgba(18,22,27,0.55)]',
          '[&>button:hover]:bg-[#f7f6f9] [&>button:hover]:text-[#12161b]',
          '[&>button>svg]:size-4',
        )}
      >
        <div className={styles.header}>
          <span className={styles.caseId}>ENK-{questionId}</span>
          <DialogTitle className={styles.title}>
            Вопрос и ответ #{questionId}
          </DialogTitle>
          {questionDate && (
            <p className={styles.meta}>Дата обращения: {questionDate}</p>
          )}
          {questionText ? (
            <p className={styles.questionBox}>{questionText}</p>
          ) : null}
        </div>

        <div className={styles.body}>
          {panel === 'menu' && (
            <MenuPanel
              isDownloadBusy={isDownloadBusy}
              downloadStatus={downloadStatus}
              previewLoading={previewLoading}
              copyStatus={copyStatus}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onCopyLink={handleCopyLink}
              onOpenSms={() => setPanel('sms')}
              onOpenEmail={() => setPanel('email')}
            />
          )}

          {panel === 'sms' && (
            <SubPanel
              title="Отправить по SMS"
              onBack={() => {
                setPanel('menu')
                setSmsStatus('idle')
              }}
            >
              <div className={styles.stack}>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="+7 (___) ___-__-__"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(formatPhoneInput(e.target.value))
                    setPhoneError(null)
                  }}
                  disabled={smsStatus === 'loading'}
                  aria-invalid={!!phoneError}
                  className={cn('tabular-nums', phoneError && styles.inputError)}
                />
                {phoneError && (
                  <p className={styles.fieldError}>
                    <AlertCircle className="h-3.5 w-3.5" /> {phoneError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSendSms}
                  disabled={smsStatus === 'loading'}
                  className={styles.submitBtn}
                >
                  {smsStatus === 'loading' ? (
                    <>
                      <Loader2 className={`h-4 w-4 ${styles.spin}`} /> Отправляем…
                    </>
                  ) : (
                    'Отправить'
                  )}
                </button>
              </div>
            </SubPanel>
          )}

          {panel === 'email' && (
            <SubPanel
              title="Отправить на email"
              onBack={() => {
                setPanel('menu')
                setEmailStatus('idle')
              }}
            >
              <div className={styles.stack}>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError(null)
                  }}
                  disabled={emailStatus === 'loading'}
                  aria-invalid={!!emailError}
                  className={cn(emailError && styles.inputError)}
                />
                {emailError && (
                  <p className={styles.fieldError}>
                    <AlertCircle className="h-3.5 w-3.5" /> {emailError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={emailStatus === 'loading'}
                  className={styles.submitBtn}
                >
                  {emailStatus === 'loading' ? (
                    <>
                      <Loader2 className={`h-4 w-4 ${styles.spin}`} /> Отправляем…
                    </>
                  ) : (
                    'Отправить'
                  )}
                </button>
              </div>
            </SubPanel>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface MenuPanelProps {
  isDownloadBusy: boolean
  downloadStatus: DownloadStatus
  previewLoading: boolean
  copyStatus: 'idle' | 'copied'
  onDownload: () => void
  onPreview: () => void
  onCopyLink: () => void
  onOpenSms: () => void
  onOpenEmail: () => void
}

function MenuPanel({
  isDownloadBusy,
  downloadStatus,
  previewLoading,
  copyStatus,
  onDownload,
  onPreview,
  onCopyLink,
  onOpenSms,
  onOpenEmail,
}: MenuPanelProps) {
  return (
    <div className={styles.stack}>
      <button
        type="button"
        onClick={onDownload}
        disabled={isDownloadBusy}
        className={styles.downloadBtn}
      >
        {isDownloadBusy ? (
          <>
            <Loader2 className={`h-4 w-4 ${styles.spin}`} />
            {downloadStatus === 'generating' ? 'Генерируем…' : 'Загружаем…'}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" /> Скачать PDF
          </>
        )}
      </button>

      <div className={styles.actionsGrid}>
        <IconAction
          icon={<Eye className="h-4 w-4" />}
          label="Просмотр"
          onClick={onPreview}
          loading={previewLoading}
          disabled={isDownloadBusy}
        />
        <IconAction
          icon={<MessageSquare className="h-4 w-4" />}
          label="SMS"
          onClick={onOpenSms}
          disabled={isDownloadBusy}
        />
        <IconAction
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          onClick={onOpenEmail}
          disabled={isDownloadBusy}
        />
        <IconAction
          icon={
            copyStatus === 'copied' ? (
              <Check className="h-4 w-4" />
            ) : (
              <Link2 className="h-4 w-4" />
            )
          }
          label={copyStatus === 'copied' ? 'Готово' : 'Ссылка'}
          onClick={onCopyLink}
          disabled={isDownloadBusy}
          success={copyStatus === 'copied'}
        />
      </div>
    </div>
  )
}

interface IconActionProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  success?: boolean
}

function IconAction({
  icon,
  label,
  onClick,
  disabled,
  loading,
  success,
}: IconActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={styles.iconAction}
      aria-label={label}
    >
      <span className={`${styles.iconWrap} ${success ? styles.iconWrapSuccess : ''}`}>
        {loading ? <Loader2 className={`h-4 w-4 ${styles.spin}`} /> : icon}
      </span>
      <span className={styles.iconLabel}>{label}</span>
    </button>
  )
}

interface SubPanelProps {
  title: string
  onBack: () => void
  children: React.ReactNode
}

function SubPanel({ title, onBack, children }: SubPanelProps) {
  return (
    <div className={styles.stack}>
      <div className={styles.subHeader}>
        <button type="button" onClick={onBack} className={styles.backBtn}>
          ← Назад
        </button>
        <span className={styles.subTitle}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
