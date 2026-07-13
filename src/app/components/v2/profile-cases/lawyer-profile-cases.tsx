'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { User } from 'next-auth'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'

import type { DBQuestion } from '@/src/interfaces/db'
import { statusesDesign } from '@/src/interfaces/data'
import { CustomGetRequest } from '@/src/libs/request'
import { TruncatedText } from '@/src/app/components/v2/lawyer-requests/truncated-text'
import styles from './profile-cases.module.css'

type Props = {
  user: User
}

export function LawyerProfileCases({ user }: Props) {
  const [jobs, setJobs] = useState<DBQuestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      const res = await CustomGetRequest('/requests', {
        range: JSON.stringify([0, 49]),
        sort: JSON.stringify(['updated_at', 'DESC']),
        filter: JSON.stringify({ admin_id: user.id }),
      })
      if (active) {
        setJobs(res.status && Array.isArray(res.data) ? (res.data as DBQuestion[]) : [])
        setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [user.id])

  if (loading) {
    return (
      <div className={styles.card}>
        <p className={styles.emptyText} style={{ padding: 32 }}>
          Загружаем дела…
        </p>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.list}>
          {jobs.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Пока нет назначенных дел</p>
              <p className={styles.emptyText}>Откройте общий список заявок, чтобы взять дело в работу.</p>
              <Link href="/admin/requests" className={styles.createBtn} style={{ marginTop: 16 }}>
                Все заявки
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            jobs.map((item) => {
              const status = item.job_status != null ? statusesDesign[item.job_status] : null
              return (
                <Link
                  key={item.id}
                  href={`/admin/requests/${item.id}`}
                  className={styles.caseMain}
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                >
                  <div className={styles.caseId}>#{item.id}</div>
                  <TruncatedText text={item.question} className={styles.caseTitleLink} />
                  <div className={styles.caseDate}>
                    {item.username ? `${item.username} · ` : ''}
                    {item.updated_at
                      ? format(new Date(item.updated_at), 'dd.MM.yyyy HH:mm')
                      : '—'}
                    {status ? ` · ${status.name}` : ''}
                  </div>
                </Link>
              )
            })
          )}
        </div>
        {jobs.length > 0 ? (
          <div style={{ padding: '0 32px 32px' }}>
            <Link href="/admin/requests" className={styles.createBtn}>
              Все заявки
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
