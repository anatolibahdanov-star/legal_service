'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

import { CustomGetRequest } from '@/src/libs/request'
import type { DBUser } from '@/src/interfaces/db'
import { ProfileContent } from '@/src/app/components/v2/profile-content/profile-content'
import { StaffGate } from './staff-gate'
import { LawyerRequestsTable } from './lawyer-requests-table'
import styles from './lawyer-requests.module.css'

type LawyerPageTab = 'requests' | 'my-cases' | 'archive' | 'account'

const TITLES: Record<LawyerPageTab, string> = {
  requests: 'Заявки',
  'my-cases': 'Мои дела',
  archive: 'Архив вопросов',
  account: 'Аккаунт',
}

export function LawyerRequestsPage() {
  const { data: session } = useSession()
  const isSuper = !!session?.user?.is_super
  const user = session?.user
  const isLawyer = user?.role === 'lowyer'

  const [activeTab, setActiveTab] = useState<LawyerPageTab>('requests')
  const [accountData, setAccountData] = useState<DBUser | null>(null)

  useEffect(() => {
    if (!user?.id || !isLawyer) return
    let active = true
    const fetchAccount = async () => {
      const res = await CustomGetRequest(`/administrators/${user.id}`)
      if (active && res.status && res.data) setAccountData(res.data as DBUser)
    }
    void fetchAccount()
    const onFocus = () => { void fetchAccount(); }
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      window.removeEventListener('focus', onFocus)
    }
  }, [user?.id, isLawyer])

  return (
    <StaffGate>
      <main id="lawyer-requests-page" className={`v2-header-bleed ${styles.page}`}>
        <section className={styles.container}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>{TITLES[activeTab]}</h1>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'requests' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                Заявки
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'my-cases' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('my-cases')}
              >
                Мои дела
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'archive' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('archive')}
              >
                Архив
              </button>
              <button
                type="button"
                className={`${styles.tab} ${activeTab === 'account' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('account')}
              >
                Аккаунт
              </button>
              {isSuper && (
                <Link href="/admin/" className={styles.tab}>
                  Старая админка
                </Link>
              )}
            </div>
          </div>

          {activeTab === 'account' ? (
            <div className={styles.accountWrap}>
              {user && (
                <ProfileContent
                  data={accountData}
                  user={user}
                  setData={setAccountData}
                  apiBase="/administrators"
                  hidePhone
                />
              )}
            </div>
          ) : activeTab === 'my-cases' ? (
            <LawyerRequestsTable scope="mine" isSuper={isSuper} adminId={user?.id} />
          ) : activeTab === 'archive' ? (
            <LawyerRequestsTable scope="archive" isSuper={isSuper} />
          ) : (
            <LawyerRequestsTable scope="all" isSuper={isSuper} />
          )}
        </section>
      </main>
    </StaffGate>
  )
}
