'use client'

import { Fragment } from 'react'
import Image from 'next/image'
import illustration from '@/public/design/v2-main-page/how-it-works-illustration.png'
import styles from './how-it-works.module.css'
import { TABS, STEPS, PROCESS_STEPS } from './how-it-works.data'

export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.howItWorks}>
      <div className={styles.desktopBlock}>
      <div className={styles.howItWorksContainer}>
        <div className={styles.howItWorksInner}>
          <div className={styles.howItWorksHeader}>
            <h2 className={styles.sectionTitleLg}>Как мы работаем</h2>
            <p className={styles.sectionSubtitleLg}>
              Профессиональный правовой аудит{' '}
              <span className={styles.accentViolet}>без лишних звонков</span>
            </p>
          </div>

          <div className={styles.tabs}>
            {TABS.map((tab, index) => {
              const isActive = index === 0

              return (
                <div key={index} className={styles.tabItem}>
                  {isActive ? (
                    <div className={styles.tabActiveWrap}>
                      <svg
                        width="309"
                        height="48"
                        viewBox="0 0 309 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={styles.tabActiveSvg}
                      >
                        <path
                          d="M0 22.4C0 14.5593 0 10.6389 1.52591 7.64413C2.86814 5.00986 5.00986 2.86814 7.64413 1.52591C10.6389 0 14.5593 0 22.4 0H281.664C283.027 0 283.708 0 284.355 0.144528C284.928 0.272709 285.48 0.484415 285.991 0.772868C286.569 1.09811 287.075 1.55417 288.088 2.46628L301.438 14.4884C305.096 17.7826 306.925 19.4296 307.6 21.3693C308.193 23.0729 308.193 24.9271 307.6 26.6307C306.925 28.5704 305.096 30.2174 301.438 33.5116L288.088 45.5337C287.075 46.4458 286.569 46.9019 285.991 47.2271C285.48 47.5156 284.928 47.7273 284.355 47.8555C283.708 48 283.027 48 281.664 48H22.4C14.5593 48 10.6389 48 7.64413 46.4741C5.00986 45.1319 2.86814 42.9901 1.52591 40.3559C0 37.3611 0 33.4407 0 25.6V22.4Z"
                          fill="#34347C"
                        />
                        <path
                          d="M22.4004 0.25H281.664C283.038 0.25 283.687 0.251659 284.3 0.388672C284.849 0.511513 285.379 0.713803 285.869 0.990234C286.417 1.29878 286.9 1.73293 287.921 2.65234L301.271 14.6738C303.103 16.3237 304.465 17.551 305.455 18.6074C306.443 19.6619 307.043 20.5288 307.364 21.4512C307.939 23.1016 307.939 24.8984 307.364 26.5488C307.043 27.4712 306.443 28.3381 305.455 29.3926C304.465 30.449 303.103 31.6763 301.271 33.3262L287.921 45.3477C286.9 46.2671 286.417 46.7012 285.869 47.0098C285.379 47.2862 284.849 47.4885 284.3 47.6113C283.687 47.7483 283.038 47.75 281.664 47.75H22.4004C18.4762 47.75 15.5475 47.7502 13.2256 47.5605C10.9065 47.3711 9.21408 46.993 7.75781 46.251C5.17059 44.9327 3.06728 42.8294 1.74902 40.2422C1.00702 38.7859 0.628929 37.0935 0.439453 34.7744C0.249775 32.4525 0.25 29.5239 0.25 25.5996V22.4004C0.25 18.4761 0.249775 15.5475 0.439453 13.2256C0.628929 10.9065 1.00702 9.21408 1.74902 7.75781C3.06728 5.17059 5.17059 3.06728 7.75781 1.74902C9.21408 1.00702 10.9065 0.628929 13.2256 0.439453C15.5475 0.249775 18.4761 0.25 22.4004 0.25Z"
                          stroke="white"
                          strokeOpacity="0.5"
                          strokeWidth="0.5"
                        />
                      </svg>
                      <div className={styles.tabActiveLabel}>{tab}</div>
                    </div>
                  ) : (
                    <div className={styles.tabInactive}>{tab}</div>
                  )}
                </div>
              )
            })}
          </div>

          <div className={styles.howItWorksBody}>
            <div className={styles.stepsList}>
              {STEPS.map((step) => (
                <div key={step.num} className={styles.stepRow}>
                  <span className={styles.stepNumber}>{step.num}</span>
                  <div className={styles.stepText}>
                    <h4 className={styles.stepTitle}>{step.title}</h4>
                    <p className={styles.stepDesc}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.howItWorksIllustration}>
              <Image
                src={illustration}
                alt="How it works illustration"
                fill
                className={styles.illustrationImage}
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className={styles.mobileBlock}>
        <div className={styles.mobileHeader}>
          <h2 className={styles.mobileTitle}>Как мы работаем</h2>
          <p className={styles.mobileSubtitle}>
            Профессиональный правовой аудит{' '}
            <span className={styles.accentViolet}>без лишних звонков</span>
          </p>
        </div>

        <div className={styles.processList}>
          {PROCESS_STEPS.map((step) => (
            <Fragment key={step.title}>
              <div className={styles.processCard}>
                <div className={styles.processCardImg}>
                  <Image src={step.img} alt="" fill className={styles.processImg} />
                </div>
                <div className={styles.processCardText}>
                  <h4 className={styles.processCardTitle}>{step.title}</h4>
                  <p className={styles.processCardDesc}>{step.desc}</p>
                </div>
              </div>
              {step.divider && (
                <div className={styles.processDividerWrap}>
                  <div
                    className={styles.processDivider}
                    style={{ borderImage: `${step.divider} 1` }}
                  />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
