'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'

import type { CategoryOption, LawyerRequestFilters } from './lawyer-requests.data'
import {
  EMAIL_STATUS_OPTIONS,
  FILTER_FIELD_DEFS,
  OPTIONAL_FILTER_KEYS,
  type OptionalFilterKey,
  type StatusOption,
} from './lawyer-requests.data'
import styles from './lawyer-requests.module.css'

type Props = {
  filters: LawyerRequestFilters
  activeKeys: OptionalFilterKey[]
  categories: CategoryOption[]
  /** Набор статусов зависит от вкладки: рабочие или архивные. */
  statusOptions: StatusOption[]
  onChange: (next: LawyerRequestFilters) => void
  onActiveKeysChange: (keys: OptionalFilterKey[]) => void
}

export function LawyerFilterBar({
  filters,
  activeKeys,
  categories,
  statusOptions,
  onChange,
  onActiveKeysChange,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const set = <K extends keyof LawyerRequestFilters>(key: K, v: LawyerRequestFilters[K]) => {
    onChange({ ...filters, [key]: v })
  }

  const available = OPTIONAL_FILTER_KEYS.filter((k) => !activeKeys.includes(k))

  const addFilter = (key: OptionalFilterKey) => {
    onActiveKeysChange([...activeKeys, key])
    setMenuOpen(false)
  }

  const removeFilter = (key: OptionalFilterKey) => {
    onActiveKeysChange(activeKeys.filter((k) => k !== key))
    const next = { ...filters }
    if (key === 'date_range') {
      delete next.published_at_gte
      delete next.published_at_lte
    } else {
      delete next[key]
    }
    onChange(next)
  }

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterAlwaysOn}>
        <div className={styles.addFilterWrap} ref={menuRef}>
          <button
            type="button"
            className={styles.filterBtn}
            disabled={available.length === 0}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Plus size={16} />
            Добавить фильтр
          </button>
          {menuOpen && available.length > 0 && (
            <div className={styles.addFilterMenu} role="menu">
              {available.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={styles.addFilterItem}
                  role="menuitem"
                  onClick={() => addFilter(key)}
                >
                  {FILTER_FIELD_DEFS[key].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeKeys.length > 0 && (
        <div className={styles.filterActiveRow}>
          {activeKeys.map((key) => {
            const def = FILTER_FIELD_DEFS[key]
            return (
              <div key={key} className={styles.filterChip}>
                <span className={styles.filterChipLabel}>{def.label}</span>
                {def.kind === 'text' && (
                  <input
                    className={styles.filterChipInput}
                    value={String(filters[key as 'username' | 'email' | 'question'] ?? '')}
                    placeholder={def.label}
                    onChange={(e) => set(key as 'username' | 'email' | 'question', e.target.value)}
                    autoFocus
                  />
                )}
                {def.kind === 'category' && (
                  <select
                    className={styles.filterChipSelect}
                    value={filters.category ?? ''}
                    onChange={(e) => set('category', e.target.value)}
                  >
                    <option value="">Все</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                {def.kind === 'status' && (
                  <select
                    className={styles.filterChipSelect}
                    value={filters.status ?? ''}
                    onChange={(e) => set('status', e.target.value)}
                  >
                    <option value="">Все</option>
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
                {def.kind === 'email_status' && (
                  <select
                    className={styles.filterChipSelect}
                    value={filters.email_status ?? ''}
                    onChange={(e) => set('email_status', e.target.value)}
                  >
                    <option value="">Все</option>
                    {EMAIL_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
                {def.kind === 'date_range' && (
                  <div className={styles.filterChipDateRange}>
                    <input
                      type="date"
                      className={styles.filterChipDateInput}
                      value={filters.published_at_gte ?? ''}
                      onChange={(e) => set('published_at_gte', e.target.value)}
                      autoFocus
                    />
                    <span className={styles.filterChipLabel}>—</span>
                    <input
                      type="date"
                      className={styles.filterChipDateInput}
                      value={filters.published_at_lte ?? ''}
                      onChange={(e) => set('published_at_lte', e.target.value)}
                    />
                  </div>
                )}
                <button
                  type="button"
                  className={styles.filterChipRemove}
                  aria-label={`Убрать фильтр ${def.label}`}
                  onClick={() => removeFilter(key)}
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
