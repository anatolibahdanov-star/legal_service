'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function isStaffRole(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'lowyer'
}

export function StaffGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = session?.user?.role

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.replace('/')
      return
    }
    if (role === 'admin') {
      window.location.replace('/admin#/requests')
      return
    }
    if (role !== 'lowyer') {
      router.replace('/profile')
    }
  }, [status, role, router])

  if (status === 'loading' || status === 'unauthenticated' || role === 'admin') {
    return (
      <main className="v2-header-bleed" style={{ padding: '120px 24px', textAlign: 'center' }}>
        <p>Загрузка…</p>
      </main>
    )
  }

  if (role !== 'lowyer') {
    return (
      <main className="v2-header-bleed" style={{ padding: '120px 24px', textAlign: 'center' }}>
        <p>Нет доступа</p>
      </main>
    )
  }

  return <>{children}</>
}
