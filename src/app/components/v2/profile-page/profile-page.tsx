'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Swal from 'sweetalert2'

import { ProfileSidebar } from '@/src/app/components/v2/profile-sidebar/profile-sidebar'
import { ProfileContent } from '@/src/app/components/v2/profile-content/profile-content'
import { V2ProfileBalance } from '@/src/app/components/v2/profile-balance/profile-balance'
import { V2ProfileCases } from '@/src/app/components/v2/profile-cases/profile-cases'
import { ProfilePaymentHistory } from '@/src/app/components/screen/profile/ProfilePaymentHistory'
import { CustomGetRequest } from '@/src/libs/request'
import { emitBalanceRefresh } from '@/src/libs/balanceEvents'
import type { DBUser } from '@/src/interfaces/db'
import styles from './profile-page.module.css'

type ProfileTab = 'account' | 'balance' | 'cases' | 'payments'

const TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: 'cases', label: 'Ваши заявки' },
  { id: 'balance', label: 'Баланс' },
  { id: 'account', label: 'Аккаунт' },
]

const isProfileTab = (value: string | null): value is ProfileTab =>
  value === 'account' || value === 'balance' || value === 'cases' || value === 'payments'

export function V2ProfilePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const tabParam = searchParams.get('tab')
  const activeTab: ProfileTab = isProfileTab(tabParam) ? tabParam : 'cases'
  const [data, setData] = useState<DBUser | null>(null)
  const [editEmailSignal, setEditEmailSignal] = useState(0)

  const selectTab = (tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'cases') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const user = session?.user
  const userId = user?.id
  const userRole = user?.role
  const isStaff = !!userRole && userRole !== 'user'
  const showSidebar = activeTab === 'account'

  useEffect(() => {
    if (status === 'loading') return
    if (!userId) {
      router.replace('/')
      return
    }
    if (isStaff) {
      window.location.replace('/admin#/profile')
    }
  }, [status, userId, isStaff, router])

  useEffect(() => {
    if (!userId || isStaff) return

    let active = true
    const fetchData = async () => {
      const userData = await CustomGetRequest(`/users/${userId}`)
      if (active && userData.status) {
        setData(userData.data as DBUser)
      }
    }

    fetchData()
    const onFocus = () => {
      void fetchData()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      window.removeEventListener('focus', onFocus)
    }
  }, [userId, isStaff])

  const setUserBalance = (additionalBalance: number) => {
    if (!additionalBalance || !data) return
    const rub = Math.round(additionalBalance / 100)
    setData({ ...data, balance: (data.balance ?? 0) + rub })
    Swal.fire({
      title: 'Успешная операция',
      text: `Ваш баланс успешно пополнен на ${new Intl.NumberFormat('ru-RU').format(rub)} ₽.`,
      icon: 'success',
      draggable: true,
    })
    emitBalanceRefresh()
  }

  if (status === 'loading' || !user || isStaff) {
    return (
      <main className={`v2-header-bleed ${styles.page}`}>
        <section className={styles.container}>
          <p className={styles.loadingText}>Загружается...</p>
        </section>
      </main>
    )
  }

  return (
    <main id="profile-page" className={`v2-header-bleed ${styles.page}`}>
      <section className={styles.container}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <h1 className={styles.title}>Личный кабинет</h1>
          </div>

          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.body}>
            {showSidebar && (
              <ProfileSidebar
                data={data}
                user={user}
                setData={setData}
                onEditEmail={() => setEditEmailSignal((n) => n + 1)}
              />
            )}

            {activeTab === 'account' ? (
              <div className={styles.contentCol}>
                <ProfileContent
                  data={data}
                  user={user}
                  setData={setData}
                  editEmailSignal={editEmailSignal}
                />
              </div>
            ) : activeTab === 'balance' ? (
              <div className={styles.fullCol}>
                <V2ProfileBalance data={data} setUserBalance={setUserBalance} />
              </div>
            ) : activeTab === 'payments' ? (
              <div className={styles.contentCol}>
                <ProfilePaymentHistory />
              </div>
            ) : (
              <V2ProfileCases user={user} />
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
