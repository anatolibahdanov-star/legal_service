'use client'

import { useEffect } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/app/components/ui/alert-dialog'

import styles from './lawyer-request-detail.module.css'

export type ConfirmationAction = {
  title: string
  description: string
  confirmLabel: string
  tone?: 'primary' | 'danger'
  run: () => void | Promise<void>
}

type Props = {
  action: ConfirmationAction | null
  onClose: () => void
  onConfirm: () => void
}

export function ActionConfirmDialog({ action, onClose, onConfirm }: Props) {
  const isOpen = !!action

  useEffect(() => {
    if (!isOpen) return
    const bodyOverflow = document.body.style.overflow
    const rootOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = rootOverflow
    }
  }, [isOpen])

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <AlertDialogContent className={styles.confirmDialog}>
        <AlertDialogHeader>
          <AlertDialogTitle className={styles.confirmTitle}>{action?.title}</AlertDialogTitle>
          <AlertDialogDescription className={styles.confirmDescription}>
            {action?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={styles.confirmCancel}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            className={action?.tone === 'danger' ? styles.confirmDanger : styles.confirmAction}
            onClick={onConfirm}
          >
            {action?.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
