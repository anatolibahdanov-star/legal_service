import Image from 'next/image'
import heroImage from '@/public/design/v2-main-page/hero-image.jpg'
import heroImageMobile from '@/public/design/v2-main-page/hero-image-mobile.png'

import { InquirySection } from '@/src/app/components/v2/inquiry-section/inquiry-section'
import { Subscriptions } from '@/src/app/components/v2/subscriptions/subscriptions'
import { HowItWorks } from '@/src/app/components/v2/how-it-works/how-it-works'
import styles from './page.module.css'

export default function Home() {
  return (
    <main id="main-landing-page" className={styles.page}>
      <section id="hero" className={styles.hero}>
        <div className={styles.heroImageWrap}>
          <Image
            src={heroImage}
            alt="ENKI hero background"
            priority
            fill
            sizes="100vw"
            className={`${styles.heroImage} ${styles.heroImageDesktop}`}
          />
          <Image
            src={heroImageMobile}
            alt="ENKI hero background"
            priority
            fill
            sizes="100vw"
            className={`${styles.heroImage} ${styles.heroImageMobile}`}
          />
          <div className={styles.heroOverlay} aria-hidden />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Ваш персональный
              <br />
              юрист в кармане
            </h1>
            <p className={styles.heroSubtitle}>
              ИИ подбирает решение, практикующий юрист проверяет и формирует
              официальное заключение.
            </p>
            <p className={styles.heroSubtitle}>
              Пользователь получает ответ в пределах 3-х часов с момента
              отправки запроса.
            </p>
          </div>
        </div>
      </section>

      <InquirySection />
      <Subscriptions />
      <HowItWorks />
    </main>
  )
}
