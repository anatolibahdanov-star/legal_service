'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'

import type { AttachmentDTO, DBQuestion } from '@/src/interfaces/db'
import { AttachmentList } from '@/src/app/components/data/AttachmentList'
import { FileUpload } from '@/src/app/components/forms/FileUpload'
import { uploadQuestionAttachmentsAction } from '@/src/app/components/forms/action/attachments'
import { CustomGetRequest } from '@/src/libs/request'
import styles from './upload-documents-modal.module.css'

type UploadDocumentsModalProps = {
  caseItem: DBQuestion | null
  isOpen: boolean
  onClose: () => void
  onUploaded?: () => void
}

export function UploadDocumentsModal({
  caseItem,
  isOpen,
  onClose,
  onUploaded,
}: UploadDocumentsModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [existing, setExisting] = useState<AttachmentDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !caseItem) return

    setFiles([])
    setError('')
    setLoading(true)

    const load = async () => {
      const res = await CustomGetRequest(`/attachments/question/${caseItem.id}`)
      if (res.status && Array.isArray(res.data)) {
        setExisting(res.data as AttachmentDTO[])
      } else {
        setExisting([])
      }
      setLoading(false)
    }

    load()
  }, [isOpen, caseItem?.id])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!isOpen || !caseItem) return null

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Выберите хотя бы один файл.')
      return
    }

    setSubmitting(true)
    setError('')

    const result = await uploadQuestionAttachmentsAction(caseItem.id, files)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error ?? 'Не удалось загрузить файлы.')
      return
    }

    toast.success('Документы загружены')
    onUploaded?.()
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-documents-title"
      >
        <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Закрыть">
          <X className={styles.icon20} />
        </button>

        <h2 id="upload-documents-title" className={styles.title}>
          Загрузить документы
        </h2>
        <p className={styles.subtitle}>
          Прикрепите документы по делу. Юрист получит их в рамках вашего обращения.
        </p>

        {!loading && existing.length > 0 && (
          <div>
            <p className={styles.existingTitle}>Уже загружено</p>
            <AttachmentList attachments={existing} />
          </div>
        )}

        <FileUpload
          files={files}
          onFilesChange={setFiles}
          disabled={submitting}
          existingCount={existing.length}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={submitting}>
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.submitBtn}
            disabled={submitting || files.length === 0}
          >
            {submitting ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>
      </div>
    </div>
  )
}
