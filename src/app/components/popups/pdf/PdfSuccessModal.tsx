'use client'

import { Check } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/src/app/components/ui/dialog'
import { cn } from '@/src/app/components/ui/utils'
import styles from './pdf-actions-modal.module.css'

interface PdfSuccessModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  questionId: string | number
  questionDate?: string
  message?: string
}

export function PdfSuccessModal({
  open,
  onOpenChange,
  questionId,
  questionDate,
  message = 'PDF успешно отправлен',
}: PdfSuccessModalProps) {
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
        </div>

        <div className={styles.successBody}>
          <div className={styles.successIcon}>
            <Check className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <p className={styles.successText}>{message}</p>
          <button type="button" onClick={() => onOpenChange(false)} className={styles.downloadBtn}>
            Готово
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
