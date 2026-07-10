import Image from 'next/image'
import heroImage from '@/public/design/v2-main-page/hero-image.jpg'

import { InquirySection } from '@/src/app/components/v2/inquiry-section/inquiry-section'
import { HowItWorks } from '@/src/app/components/v2/how-it-works/how-it-works'
import { WhyUs } from '@/src/app/components/v2/why-us/why-us'
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
            className={styles.heroImage}
          />
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Задавайте вопросы опытным юристам онлайн
          </h1>
        </div>
      </section>

      <InquirySection />
      <HowItWorks />
      <WhyUs />
    </main>
  )
}
