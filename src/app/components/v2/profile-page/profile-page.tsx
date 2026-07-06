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

type ProfileTab = 'account' | 'balance' | 'cases' | 'payments'

const TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: 'account', label: 'Аккаунт' },
  { id: 'balance', label: 'Баланс' },
  { id: 'cases', label: 'Ваши заявки' },
]

const isProfileTab = (value: string | null): value is ProfileTab =>
  value === 'account' || value === 'balance' || value === 'cases' || value === 'payments'

export function V2ProfilePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const tabParam = searchParams.get('tab')
  const activeTab: ProfileTab = isProfileTab(tabParam) ? tabParam : 'account'
  const [data, setData] = useState<DBUser | null>(null)

  const selectTab = (tab: ProfileTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'account') {
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
      <main className="v2-header-bleed min-h-screen bg-[#F9F9F9] text-[#12161B]">
        <section className="mx-auto max-w-[1440px] px-6 py-16 md:px-8 lg:px-[100px]">
          <p className="text-[16px] text-[rgba(18,22,27,0.6)]">Загружается...</p>
        </section>
      </main>
    )
  }

  return (
    <main id="profile-page" className="v2-header-bleed min-h-screen bg-[#F9F9F9] text-[#12161B]">
      <section className="mx-auto max-w-[1440px] px-6 py-[46px] md:px-8 lg:px-[100px]">
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <h1
              className="text-[#12161B] font-semibold leading-[56px] tracking-[-0.01em]"
              style={{ fontSize: 48 }}
            >
              Личный кабинет
            </h1>
          </div>

          <div className="flex w-fit p-1 bg-gradient-to-br from-[rgba(153,153,202,0.06)] to-[rgba(165,165,221,0.06)] border border-[rgba(18,22,27,0.05)] rounded-[18px]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={`flex items-center justify-center px-6 py-[13px] rounded-[14px] font-medium text-[18px] leading-[23px] tracking-[-0.01em] transition-all cursor-pointer active:scale-[0.98] ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#34347C] to-[#34537C] text-white hover:opacity-95'
                    : 'text-[#12161B] hover:bg-black/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-start gap-12">
            {showSidebar && <ProfileSidebar data={data} user={user} />}

            {activeTab === 'account' ? (
              <div className="min-w-0 flex-1">
                <ProfileContent data={data} user={user} setData={setData} />
              </div>
            ) : activeTab === 'balance' ? (
              <div className="w-full">
                <V2ProfileBalance data={data} setUserBalance={setUserBalance} />
              </div>
            ) : activeTab === 'payments' ? (
              <div className="flex-1">
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
