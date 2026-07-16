'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import styles from './why-us.module.css'
import { CARDS } from './why-us.data'

function WhyUsMobileCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    slidesToScroll: 1,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    const onResize = () => emblaApi.reInit()
    window.addEventListener('resize', onResize)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
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
    <>
      <div className={styles.emblaViewport} ref={emblaRef}>
        <div className={styles.emblaContainer}>
          {CARDS.map((card) => (
            <div key={card.title} className={styles.emblaSlide}>
              <div
                className={styles.mobileCard}
                style={
                  {
                    '--card-bg': card.bg,
                    '--card-icon-bg': card.iconBg,
                    '--card-text': card.textColor,
                  } as React.CSSProperties
                }
              >
                <div className={styles.mobileCardIcon}>
                  <Image src={card.icon} alt="" width={48} height={48} />
                </div>
                <div className={styles.mobileCardBody}>
                  <p className={styles.mobileCardTitle}>{card.title}</p>
                  <p className={styles.mobileCardDesc}>{card.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.dots} role="tablist" aria-label="Карточки">
        {CARDS.map((card, i) => (
          <button
            key={card.title}
            type="button"
            role="tab"
            aria-selected={i === selectedIndex}
            aria-label={`Слайд ${i + 1}`}
            className={`${styles.dot} ${i === selectedIndex ? styles.dotActive : ''}`}
            onClick={() => scrollTo(i)}
          />
        ))}
      </div>
    </>
  )
}

export function WhyUs() {
  return (
    <div className={styles.whyUs}>
      <div className={styles.desktopBlock}>
        <div className={styles.whyUsContainer}>
          <div className={styles.whyUsGrid}>
            {CARDS.map((card, i) => (
              <div
                key={i}
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
                  <Image src={card.icon} alt={card.title} width={48} height={48} />
                </div>

                <div className={styles.whyUsCardBody}>
                  <p className={styles.whyUsCardTitle}>{card.title}</p>
                  <p className={styles.whyUsCardDesc}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.mobileBlock}>
        <div className={styles.mobileCarouselWrap}>
          <WhyUsMobileCarousel />
        </div>
      </div>
    </div>
  )
}
