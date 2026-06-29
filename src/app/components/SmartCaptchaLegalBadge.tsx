'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield } from 'lucide-react'

const STORAGE_KEY = 'enki_smartcaptcha_notice_dismissed'

export function SmartCaptchaLegalBadge() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === '1')
  }, [])

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[850] flex items-center gap-3 rounded-2xl border border-white/10 bg-[#12161B] px-4 py-3 text-white shadow-2xl"
      role="note"
      aria-label="Уведомление Yandex SmartCaptcha об обработке данных"
    >
      <Shield className="h-5 w-5 shrink-0 text-[#34347C]" aria-hidden="true" />
      <Link
        href="https://yandex.ru/legal/smartcaptcha_notice/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] leading-4 text-white/90 hover:text-white transition-colors"
      >
        Политика
        <br />
        обработки данных
      </Link>
      <button
        type="button"
        onClick={dismiss}
        className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Закрыть уведомление"
      >
        ×
      </button>
    </div>
  )
}
