'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/src/app/components/ui/tooltip'

type TruncatedTextProps = {
  text: string | null | undefined
  className?: string
  empty?: string
}

function measureOverflow(el: HTMLElement): boolean {
  if (el.scrollWidth > el.clientWidth + 1) return true
  try {
    const range = document.createRange()
    range.selectNodeContents(el)
    const textWidth = range.getBoundingClientRect().width
    return textWidth > el.clientWidth + 1
  } catch {
    return el.textContent != null && el.textContent.length > 40
  }
}

export function TruncatedText({
  text,
  className,
  empty = '—',
}: TruncatedTextProps) {
  const value = (text ?? '').trim()
  const ref = useRef<HTMLSpanElement>(null)
  const [overflowing, setOverflowing] = useState(value.length > 48)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setOverflowing(measureOverflow(el) || value.length > 48)
  }, [value])

  useLayoutEffect(() => {
    measure()
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    if (el.parentElement) ro.observe(el.parentElement)
    return () => ro.disconnect()
  }, [measure, value])

  if (!value) {
    return <span className={className}>{empty}</span>
  }

  const content = (
    <span
      ref={ref}
      className={className}
      title={overflowing ? value : undefined}
      tabIndex={overflowing ? 0 : undefined}
    >
      {value}
    </span>
  )

  if (!overflowing) return content

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="max-w-sm break-words whitespace-normal text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {value}
      </TooltipContent>
    </Tooltip>
  )
}
