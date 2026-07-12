'use client'

import type { CategoryOption } from './lawyer-requests.data'
import { STATUS_OPTIONS } from './lawyer-requests.data'
import styles from './lawyer-requests.module.css'

type Props = {
  open: boolean
  jobStatus: number
  categoryId: string | number | ''
  categories: CategoryOption[]
  saving?: boolean
  onJobStatusChange: (v: number) => void
  onSave: () => void
  onClose: () => void
}

export function LawyerMetaModal({
  open,
  jobStatus,
  categoryId,
  categories,
  saving,
  onJobStatusChange,
  onSave,
  onClose,
}: Props) {
  if (!open) return null

  const categoryName =
    categories.find((c) => String(c.id) === String(categoryId))?.name ||
    (categoryId ? `ID ${categoryId}` : 'Не выбрана')

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Статус заявки"
    >
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>Статус заявки</h3>
        <p className={styles.modalSub}>
          Можно изменить статус обработки. Категория сейчас только для просмотра.
        </p>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Статус</span>
          <select
            className={styles.fieldSelect}
            value={jobStatus}
            onChange={(e) => onJobStatusChange(Number(e.target.value))}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Категория</span>
          <input className={styles.fieldInput} value={categoryName} readOnly disabled />
        </label>

        <div className={styles.modalActions}>
          <button type="button" className={styles.ghostBtn} onClick={onClose} disabled={saving}>
            Отмена
          </button>
          <button type="button" className={styles.primaryBtn} onClick={onSave} disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
