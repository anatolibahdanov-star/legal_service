'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { CustomGetRequest } from '@/src/libs/request'
import { isStaffRole } from '@/src/app/components/v2/lawyer-requests/staff-gate'
import styles from './hero-ask-button.module.css'

const INQUIRY_HREF = '/#inquiry'

/**
 * Hero CTA: "Задать вопрос бесплатно" when the visitor still has a free
 * attempt (guest first-question benefit, is_first_question_free, or
 * free_questions > 0); otherwise plain "Задать вопрос".
 *
 * Scrolls to #inquiry on every click (same behavior as header nav anchors).
 */
export function HeroAskButton() {
  const { data: session, status } = useSession()
  const [hasFree, setHasFree] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (status !== 'authenticated' || !session?.user?.id) {
      setHasFree(true)
      return
    }

    if (isStaffRole(session.user.role)) {
      setHasFree(false)
      return
    }

    let cancelled = false
    CustomGetRequest('/wizard/auth-init')
      .then((res) => {
        if (cancelled || !res?.status) return
        const data = res.data as {
          isFirstQuestionFree?: boolean
          freeQuestions?: number
        }
        const free =
          !!data.isFirstQuestionFree ||
          (typeof data.freeQuestions === 'number' && data.freeQuestions > 0)
        setHasFree(free)
      })
      .catch(() => {
        if (!cancelled) setHasFree(false)
      })

    return () => {
      cancelled = true
    }
  }, [status, session?.user?.id, session?.user?.role])

  const label = hasFree ? 'Задать вопрос бесплатно' : 'Задать вопрос'

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target =
      document.getElementById('m-inquiry') ?? document.getElementById('inquiry')
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (window.location.hash !== '#inquiry') {
      window.history.pushState(null, '', INQUIRY_HREF)
    }
  }

  return (
    <Link href={INQUIRY_HREF} onClick={handleClick} className={styles.cta}>
      {label}
    </Link>
  )
}
