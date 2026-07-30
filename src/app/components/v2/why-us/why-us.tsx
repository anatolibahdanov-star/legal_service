'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { LEGAL_DOCUMENTS } from '@/src/app/components/legalDocuments'
import styles from './why-us.module.css'
import { CARDS } from './why-us.data'

const INSURANCE_POLICY_HREF = LEGAL_DOCUMENTS['insurance-policy'].src
const INSURANCE_POLICY_LABEL = '(полис к страховке)'

function CardDesc({ text }: { text: string }) {
  const idx = text.indexOf(INSURANCE_POLICY_LABEL)
  if (idx === -1) return text

  return (
    <>
      {text.slice(0, idx)}
      <a
        href={INSURANCE_POLICY_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.policyLink}
      >
        {INSURANCE_POLICY_LABEL}
      </a>
      {text.slice(idx + INSURANCE_POLICY_LABEL.length)}
    </>
  )
}

function WhyUsCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    slidesToScroll: 1,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    const sync = () => {
      setScrollSnaps(emblaApi.scrollSnapList())
      onSelect()
    }

    sync()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', sync)

    const onResize = () => emblaApi.reInit()
    window.addEventListener('resize', onResize)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', sync)
      window.removeEventListener('resize', onResize)
    }
  }, [emblaApi, onSelect])

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
    },
    [emblaApi],
  )

  return (
    <div className={styles.carousel}>
      <div className={styles.emblaViewport} ref={emblaRef}>
        <div className={styles.emblaContainer}>
          {CARDS.map((card) => (
            <div key={card.title} className={styles.emblaSlide}>
              <div
                className={styles.whyUsCard}
                style={
                  {
                    '--card-bg': card.bg,
                    '--card-icon-bg': card.iconBg,
                    '--card-text': card.textColor,
                  } as React.CSSProperties
                }
              >
                <div className={styles.whyUsCardIcon}>
                  <Image src={card.icon} alt="" width={48} height={48} />
                </div>
                <div className={styles.whyUsCardBody}>
                  <p className={styles.whyUsCardTitle}>{card.title}</p>
                  <p className={styles.whyUsCardDesc}>
                    <CardDesc text={card.desc} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {scrollSnaps.length > 1 ? (
        <div className={styles.dots} role="tablist" aria-label="Карточки">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === selectedIndex}
              aria-label={`Слайд ${i + 1}`}
              className={`${styles.dot} ${i === selectedIndex ? styles.dotActive : ''}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function WhyUs() {
  return (
    <div className={styles.whyUs}>
      <div className={styles.whyUsContainer}>
        <WhyUsCarousel />
      </div>
    </div>
  )
}
