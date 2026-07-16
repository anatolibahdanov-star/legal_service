'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from 'lucide-react'
import { format } from 'date-fns'

import { LawyerFilterBar } from './lawyer-filter-bar'
import { TruncatedText } from './truncated-text'
import {
  PAGE_SIZE,
  waitingElapsed,
  statusColor,
  statusLabel,
  type CategoryOption,
  type LawyerRequestFilters,
  type OptionalFilterKey,
  type RequestRow,
} from './lawyer-requests.data'
import {
  deleteRequest,
  exportLawyerRequestsCsv,
  fetchCategories,
  fetchLawyerRequests,
  type RequestSort,
} from './lawyer-requests.api'
import styles from './lawyer-requests.module.css'

const SORTABLE_COLUMNS: Array<{ field: string; label: string }> = [
  { field: 'id', label: 'ID' },
  { field: 'question', label: 'Вопрос' },
  { field: 'username', label: 'Клиент' },
  { field: 'status', label: 'Статус' },
  { field: 'lawyer', label: 'Юрист' },
  { field: 'created_at', label: 'Дата' },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

type PaginationItem = number | `ellipsis-${number}`

function paginationItems(current: number, total: number): PaginationItem[] {
  const pages = Array.from(new Set([1, total, current - 1, current, current + 1]))
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)
  const result: PaginationItem[] = []
  pages.forEach((page, index) => {
    const previous = pages[index - 1]
    if (previous && page - previous > 1) result.push(`ellipsis-${previous}`)
    result.push(page)
  })
  return result
}

const emptyFilters = (): LawyerRequestFilters => ({})

type Props = {
  /** "mine" scopes the list to the current lawyer's own cases ("Мои дела"). */
  scope: 'all' | 'mine'
  isSuper: boolean
  adminId?: string | number
}

export function LawyerRequestsTable({ scope, isSuper, adminId }: Props) {
  const router = useRouter()

  const [filters, setFilters] = useState<LawyerRequestFilters>(emptyFilters)
  const [activeFilterKeys, setActiveFilterKeys] = useState<OptionalFilterKey[]>([])
  // Newest submissions first by default — that's the order lawyers care about most.
  const [sort, setSort] = useState<RequestSort>({ field: 'created_at', dir: 'DESC' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [rows, setRows] = useState<RequestRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])

  useEffect(() => {
    void fetchCategories().then(setCategories)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await fetchLawyerRequests({
      page,
      pageSize,
      filters,
      sort,
      adminId: scope === 'mine' ? adminId : undefined,
    })
    setRows(res.rows)
    setTotal(res.total)
    if (res.error) setError(res.error)
    setLoading(false)
  }, [filters, page, pageSize, sort, scope, adminId])

  useEffect(() => {
    // Data loading owns the table's loading/error/result state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleFiltersChange = (next: LawyerRequestFilters) => {
    setPage(1)
    setFilters(next)
  }

  const handleSort = (field: string) => {
    setPage(1)
    setSort((prev) => (prev.field === field
      ? { field, dir: prev.dir === 'ASC' ? 'DESC' : 'ASC' }
      : { field, dir: 'ASC' }))
  }

  const handleExport = async () => {
    setExporting(true)
    const res = await exportLawyerRequestsCsv(filters)
    setExporting(false)
    if (!res.ok) {
      toast.error(res.error || 'Не удалось экспортировать')
      return
    }
    toast.success(`Экспорт: ${res.count ?? 0} заявок`)
  }

  const handleDelete = async (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isSuper) return
    if (!window.confirm(`Удалить заявку #${id}?`)) return
    const res = await deleteRequest(id)
    if (!res.ok) {
      toast.error(res.error || 'Ошибка удаления')
      return
    }
    toast.success('Заявка удалена')
    void load()
  }

  return (
    <div className={styles.card}>
      <div className={styles.toolbar}>
        <LawyerFilterBar
          filters={filters}
          activeKeys={activeFilterKeys}
          categories={categories}
          onChange={handleFiltersChange}
          onActiveKeysChange={setActiveFilterKeys}
        />
        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={styles.ghostBtn}
            disabled={exporting || loading}
            onClick={() => void handleExport()}
          >
            <Download size={16} />
            {exporting ? 'Экспорт…' : 'Экспорт'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className={styles.loading}>Загружаем заявки…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>
          {scope === 'mine' ? 'У вас пока нет дел в работе' : 'Заявок не найдено'}
        </p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {SORTABLE_COLUMNS.map((col) => (
                    <th key={col.field}>
                      <button
                        type="button"
                        className={styles.sortHeader}
                        onClick={() => handleSort(col.field)}
                      >
                        {col.label}
                        {sort.field === col.field ? (
                          sort.dir === 'ASC' ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          )
                        ) : (
                          <ArrowUpDown size={13} className={styles.sortIconIdle} />
                        )}
                      </button>
                    </th>
                  ))}
                  <th>В ожидании</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/admin/requests/${row.id}`)}
                  >
                    <td className={styles.idCell}>#{row.id}</td>
                    <td className={styles.questionCell}>
                      <TruncatedText text={row.question} className={styles.ellipsisText} />
                    </td>
                    <td className={styles.ellipsisCell}>
                      <TruncatedText text={row.username} className={styles.ellipsisText} />
                    </td>
                    <td>
                      <span
                        className={styles.badge}
                        style={{ background: statusColor(row.job_status) }}
                      >
                        {statusLabel(row.job_status)}
                      </span>
                    </td>
                    <td className={styles.ellipsisCell}>
                      <TruncatedText text={row.owner} className={styles.ellipsisText} />
                    </td>
                    <td>
                      {row.created_at
                        ? format(new Date(row.created_at), 'dd.MM.yyyy HH:mm')
                        : '—'}
                    </td>
                    <td>{waitingElapsed(row)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.primaryBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/requests/${row.id}`)
                          }}
                        >
                          Открыть
                        </button>
                        {isSuper && (
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={(e) => void handleDelete(row.id, e)}
                          >
                            Удалить
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileList}>
            {rows.map((row) => (
              <article
                key={`m-${row.id}`}
                className={styles.mobileCard}
                onClick={() => router.push(`/admin/requests/${row.id}`)}
              >
                <div className={styles.mobileCardTop}>
                  <span className={styles.idCell}>#{row.id}</span>
                  <span
                    className={styles.badge}
                    style={{ background: statusColor(row.job_status) }}
                  >
                    {statusLabel(row.job_status)}
                  </span>
                </div>
                <p className={styles.mobileQuestion}>{row.question || '—'}</p>
                <div className={styles.mobileMeta}>
                  <span>{row.username || '—'}</span>
                  <span>
                    {row.created_at
                      ? format(new Date(row.created_at), 'dd.MM.yyyy HH:mm')
                      : '—'}
                  </span>
                </div>
                <div className={styles.mobileMeta}>
                  <span>{waitingElapsed(row)}</span>
                  {row.owner ? <span>{row.owner}</span> : null}
                </div>
                <div className={styles.mobileActions}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin/requests/${row.id}`)
                    }}
                  >
                    Открыть
                  </button>
                  {isSuper && (
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={(e) => void handleDelete(row.id, e)}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <div className={styles.pagination}>
        <div className={styles.paginationSummary}>
          <div className={styles.paginationInfo}>
            Всего {total} · стр. {page} из {totalPages}
          </div>
          <label className={styles.pageSizeControl}>
            <span>Показывать</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPage(1)
                setPageSize(Number(event.target.value))
              }}
              aria-label="Количество заявок на странице"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.paginationControls}>
          <button
            type="button"
            className={styles.ghostBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Назад
          </button>
          <div className={styles.pageNumbers}>
            {paginationItems(page, totalPages).map((item) => (
              typeof item === 'number' ? (
                <button
                  key={item}
                  type="button"
                  className={`${styles.pageBtn} ${item === page ? styles.pageBtnActive : ''}`}
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ) : (
                <span key={item} className={styles.pageEllipsis}>…</span>
              )
            ))}
          </div>
          <button
            type="button"
            className={styles.ghostBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Вперёд
          </button>
        </div>
      </div>
    </div>
  )
}
