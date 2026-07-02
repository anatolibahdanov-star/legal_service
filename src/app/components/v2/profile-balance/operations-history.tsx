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
      return op.questionUuid ? (
        <Link
          href={`/consultation/${op.questionUuid}/`}
          className="truncate text-[#34347C] transition-colors hover:opacity-80"
        >
          {label}
        </Link>
      ) : (
        <span className="truncate">{label}</span>
      )
    }
    return <span className="truncate">{op.comment ?? op.actor}</span>
  }

  return (
    <div className="flex flex-col gap-6 rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white px-8 pb-6 pt-7 shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-[20px] font-semibold leading-6 tracking-[-0.01em] text-[#12161B]">
          История операций
        </h3>
        <div className="relative">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 appearance-none rounded-[12px] border border-[rgba(18,22,27,0.1)] bg-white pl-4 pr-10 text-[14px] font-medium leading-5 text-[#12161B] outline-none focus:border-[#34347C]"
          >
            {typeFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(18,22,27,0.5)]" />
        </div>
      </div>

      <div className="flex flex-col">
        {loading && (
          <div className="py-10 text-center text-[14px] text-[rgba(18,22,27,0.5)]">Загружаем…</div>
        )}
        {!loading && totalCount === 0 && (
          <div className="py-10 text-center text-[14px] text-[rgba(18,22,27,0.5)]">Операций пока нет</div>
        )}
        {!loading &&
          pageItems.map((op) => {
            const free = isFreeQuestionOperation(op.type)
            const credit = isCredit(op)
            return (
              <div key={op.id} className="flex min-h-[72px] items-center gap-4 border-b border-[rgba(18,22,27,0.05)] py-3 last:border-b-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${
                    credit
                      ? 'bg-[rgba(22,163,74,0.12)] text-[#16A34A]'
                      : 'bg-gradient-to-br from-[rgba(153,153,202,0.15)] to-[rgba(165,165,221,0.15)] text-[#34347C]'
                  }`}
                >
                  {free ? <Gift className="h-5 w-5" /> : credit ? <Plus className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold leading-5 text-[#12161B]">{operationTypeLabels[op.type]}</p>
                  <p className="mt-0.5 flex max-w-full truncate text-[12px] leading-[17px] text-[rgba(18,22,27,0.6)]">
                    {renderSubtitle(op)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[16px] font-semibold leading-5 ${credit ? 'text-[#16A34A]' : 'text-[#12161B]'}`}>
                    {formatOperationValue(op)}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-[17px] text-[rgba(18,22,27,0.35)]">
                    {formatDateTime(op.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
      </div>

      {totalCount > PER_PAGE && (
        <div className="flex items-center justify-between text-[13px] text-[rgba(18,22,27,0.55)]">
          <span>
            {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, totalCount)} из {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-[10px] border border-[rgba(18,22,27,0.1)] px-4 py-1.5 font-medium text-[#12161B] transition-opacity disabled:opacity-40"
            >
              Назад
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-[10px] border border-[rgba(18,22,27,0.1)] px-4 py-1.5 font-medium text-[#12161B] transition-opacity disabled:opacity-40"
            >
              Вперёд
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
