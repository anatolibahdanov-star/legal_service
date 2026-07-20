'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Gift, Plus, Wallet } from 'lucide-react'
import { AdminBalanceOperationI, AdminOperationTypeE } from '@/src/interfaces/payment'
import { CustomGetRequest } from '@/src/libs/request'
import {
  formatDateTime,
  formatOperationValue,
  isFreeQuestionOperation,
  operationTypeLabels,
} from '@/src/app/components/admin/users/format'
import styles from './operations-history.module.css'

const typeFilterOptions = [
  { value: 'all', label: 'Все операции' },
  { value: 'payment', label: 'Оплата' },
  { value: 'charge', label: 'Списание с баланса' },
  { value: 'refund', label: 'Возврат' },
  { value: 'manual', label: 'Ручное изменение' },
  { value: 'free', label: 'Бесплатные вопросы' },
]

const PER_PAGE = 6

const isCredit = (op: AdminBalanceOperationI): boolean =>
  op.type === AdminOperationTypeE.FreeAccrual ||
  op.type === AdminOperationTypeE.Refund ||
  (op.type === AdminOperationTypeE.Payment && op.questionId === null)

export function OperationsHistory() {
  const [items, setItems] = useState<AdminBalanceOperationI[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)

  const loadOperations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await CustomGetRequest('/users/me/operations/', { type })
      setItems(res.status && Array.isArray(res.data?.items) ? res.data.items : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
      setPage(1)
    }
  }, [type])

  useEffect(() => {
    loadOperations()
  }, [loadOperations])

  const totalCount = items.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = items.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const renderSubtitle = (op: AdminBalanceOperationI) => {
    if (op.questionId) {
      const label = `Вопрос №${op.questionId}`
      return (
        <Link
          href={`/profile/?tab=cases&question=${op.questionId}`}
          className={styles.subtitleLink}
        >
          {label}
        </Link>
      )
    }
    return <span className={styles.subtitleText}>{op.comment ?? op.actor}</span>
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>История операций</h3>
        <div className={styles.selectWrap}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={styles.select}
          >
            {typeFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className={styles.selectIcon} />
        </div>
      </div>

      <div className={styles.list}>
        {loading && (
          <div className={styles.stateText}>Загружаем…</div>
        )}
        {!loading && totalCount === 0 && (
          <div className={styles.stateText}>Операций пока нет</div>
        )}
        {!loading &&
          pageItems.map((op) => {
            const free = isFreeQuestionOperation(op.type)
            const credit = isCredit(op)
            return (
              <div key={op.id} className={styles.opRow}>
                <div
                  className={`${styles.opIcon} ${credit ? styles.opIconCredit : styles.opIconDefault}`}
                >
                  {free ? <Gift className={styles.opIconSvg} /> : credit ? <Plus className={styles.opIconSvg} /> : <Wallet className={styles.opIconSvg} />}
                </div>
                <div className={styles.opBody}>
                  <p className={styles.opTitle}>{operationTypeLabels[op.type]}</p>
                  <p className={styles.opSubtitle}>
                    {renderSubtitle(op)}
                  </p>
                </div>
                <div className={styles.opRight}>
                  <p className={`${styles.opValue} ${credit ? styles.opValueCredit : ''}`}>
                    {formatOperationValue(op)}
                  </p>
                  <p className={styles.opDate}>
                    {formatDateTime(op.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
      </div>

      {totalCount > PER_PAGE && (
        <div className={styles.pagination}>
          <span>
            {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, totalCount)} из {totalCount}
          </span>
          <div className={styles.pageBtns}>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className={styles.pageBtn}
            >
              Назад
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={styles.pageBtn}
            >
              Вперёд
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
