'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Download, Paperclip } from 'lucide-react'
import { format } from 'date-fns'

import { StaffGate } from './staff-gate'
import { LawyerFilterBar } from './lawyer-filter-bar'
import { TruncatedText } from './truncated-text'
import {
  defaultDateFrom,
  defaultDateTo,
  emailStatusLabel,
  PAGE_SIZE,
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
} from './lawyer-requests.api'
import styles from './lawyer-requests.module.css'

const emptyFilters = (): LawyerRequestFilters => ({
  published_at_gte: defaultDateFrom(),
  published_at_lte: defaultDateTo(),
})

export function LawyerRequestsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const isSuper = !!session?.user?.is_super

  const [filters, setFilters] = useState<LawyerRequestFilters>(emptyFilters)
  const [activeFilterKeys, setActiveFilterKeys] = useState<OptionalFilterKey[]>([])
  const [page, setPage] = useState(1)
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
    const res = await fetchLawyerRequests({ page, filters })
    setRows(res.rows)
    setTotal(res.total)
    if (res.error) setError(res.error)
    setLoading(false)
  }, [filters, page])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleFiltersChange = (next: LawyerRequestFilters) => {
    setPage(1)
    setFilters(next)
  }

  const handleResetFilters = () => {
    setPage(1)
    setFilters(emptyFilters())
    setActiveFilterKeys([])
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
    <StaffGate>
      <main id="lawyer-requests-page" className={`v2-header-bleed ${styles.page}`}>
        <section className={styles.container}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>Заявки юриста</h1>
            <div className={styles.tabs}>
              <button type="button" className={`${styles.tab} ${styles.tabActive}`}>
                Заявки
              </button>
              {isSuper && (
                <Link href="/admin/" className={styles.tab}>
                  Старая админка
                </Link>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.toolbar}>
              <LawyerFilterBar
                filters={filters}
                activeKeys={activeFilterKeys}
                categories={categories}
                onChange={handleFiltersChange}
                onActiveKeysChange={setActiveFilterKeys}
                onReset={handleResetFilters}
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
                <button type="button" className={styles.ghostBtn} onClick={() => void load()}>
                  Обновить
                </button>
              </div>
            </div>

            {loading ? (
              <p className={styles.loading}>Загружаем заявки…</p>
            ) : error ? (
              <p className={styles.error}>{error}</p>
            ) : rows.length === 0 ? (
              <p className={styles.empty}>Заявок не найдено</p>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Вопрос</th>
                        <th>Клиент</th>
                        <th>Категория</th>
                        <th>Статус</th>
                        <th>Email</th>
                        <th>Юрист</th>
                        <th>Дата</th>
                        <th>Файлы</th>
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
                          <td className={styles.ellipsisCell}>
                            <TruncatedText
                              text={row.category_name}
                              className={styles.ellipsisText}
                            />
                          </td>
                          <td>
                            <span
                              className={styles.badge}
                              style={{ background: statusColor(row.job_status) }}
                            >
                              <TruncatedText
                                text={statusLabel(row.job_status)}
                                className={styles.badgeText}
                                empty=""
                              />
                            </span>
                          </td>
                          <td className={styles.ellipsisCell}>
                            <TruncatedText
                              text={emailStatusLabel(row.email_status)}
                              className={styles.ellipsisText}
                            />
                          </td>
                          <td className={styles.ellipsisCell}>
                            <TruncatedText text={row.owner} className={styles.ellipsisText} />
                          </td>
                          <td>
                            {row.created_at
                              ? format(new Date(row.created_at), 'dd.MM.yyyy HH:mm')
                              : '—'}
                          </td>
                          <td>
                            {row.attachments && row.attachments.length > 0 ? (
                              <span className={styles.attachIcons}>
                                {row.attachments.map((a) => (
                                  <a
                                    key={a.id}
                                    href={a.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={a.filename}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Paperclip size={16} />
                                  </a>
                                ))}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
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
                      {(row.category_name || row.owner) && (
                        <div className={styles.mobileMeta}>
                          {row.category_name ? <span>{row.category_name}</span> : null}
                          {row.owner ? <span>{row.owner}</span> : null}
                        </div>
                      )}
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
              <div className={styles.paginationInfo}>
                Всего {total} · стр. {page} из {totalPages}
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
        </section>
      </main>
    </StaffGate>
  )
}
