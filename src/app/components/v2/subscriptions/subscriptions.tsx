'use client'

import { useSession } from 'next-auth/react'
import { isStaffRole } from '@/src/app/components/v2/lawyer-requests/staff-gate'
import styles from './subscriptions.module.css'

type Plan = {
  name: string
  description: string
  price: string
  priceSuffix?: string
  oldPrice?: string
  note?: string
  featured?: boolean
  /** Short line inside the colored benefit badge */
  badge: string
  /** Bright badge tint (same family as why-us cards) */
  tone: 'orange' | 'yellow' | 'purple' | 'green'
}

const plans: Plan[] = [
  {
    name: 'Разовый запрос',
    description: 'Разовая оплата 1 вопроса',
    price: '2 000 ₽',
    badge: 'Один вопрос – один ответ, без подписки',
    tone: 'orange',
  },
  {
    name: 'Старт',
    description: 'Ежемесячная подписка: 5 вопросов',
    price: '7 000 ₽',
    priceSuffix: '/мес',
    badge: '5 запросов в месяц для базовых задач',
    tone: 'yellow',
  },
  {
    name: 'Стандарт',
    description: 'Ежемесячная подписка: 10 вопросов',
    price: '15 000 ₽',
    priceSuffix: '/мес',
    featured: true,
    badge: '10 вопросов в месяц – оптимальный баланс',
    tone: 'purple',
  },
  {
    name: 'Максимум',
    description: 'Ежемесячная подписка: 30 вопросов',
    price: '35 000 ₽',
    priceSuffix: '/мес',
    badge: '30 вопросов в месяц для максимальной поддержки',
    tone: 'green',
  },
]

const BADGE_TONE_CLASS: Record<Plan['tone'], string> = {
  orange: styles.benefit_orange,
  yellow: styles.benefit_yellow,
  purple: styles.benefit_purple,
  green: styles.benefit_green,
}

function CheckIcon() {
  return (
    <span className={styles.checkIcon} aria-hidden="true">
      <svg viewBox="0 0 12 12">
        <path d="m3.1 6.2 1.8 1.7 4-4.2" />
      </svg>
    </span>
  )
}

export function Subscriptions() {
  const { data: session } = useSession()
  const isStaff = isStaffRole(session?.user?.role)

  return (
    <section id="subscriptions" className={styles.subscriptions}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>
            Купить подписку на
            <br />
            юридические консультации
          </h2>
          <div className={styles.subtitleBlock}>
            <p className={styles.subtitle}>
              {/* <strong>Подписки</strong> */}
              {/* <br /> */}
              Ежемесячные подписки с разным количеством вопросов. В случае если
              Пользователь не исчерпал лимит вопросов за месяц их остаток не
              сгорает и переносится на следующий месяц при условии продолжения
              подписки.
            </p>
            <p className={styles.subtitle}>
              Лицензия на месяц предоставляется для 1 пользователя.
            </p>
          </div>
        </header>

        <div className={styles.cardsViewport}>
          <div className={styles.cards}>
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`${styles.card} ${plan.featured ? styles.featuredCard : ''}`}
              >
                {plan.featured ? (
                  <span className={styles.featuredLabel}>Оптимальный</span>
                ) : null}

                <div>
                  <h3 className={styles.cardTitle}>{plan.name}</h3>
                  <p className={styles.cardDescription}>{plan.description}</p>
                </div>

                <p className={styles.price}>
                  {plan.oldPrice ? (
                    <span className={styles.oldPrice}>{plan.oldPrice}</span>
                  ) : null}
                  <span>{plan.price}</span>
                  {plan.priceSuffix ? (
                    <span className={styles.priceSuffix}>{plan.priceSuffix}</span>
                  ) : null}
                </p>

                <div className={`${styles.benefit} ${BADGE_TONE_CLASS[plan.tone]}`}>
                  <CheckIcon />
                  <p className={styles.benefitTitle}>{plan.badge}</p>
                </div>

                <div className={styles.cardFooter}>
                  {plan.note ? <p className={styles.note}>{plan.note}</p> : null}
                  {isStaff ? (
                    <span
                      className={`${styles.primaryButton} ${styles.primaryButtonDisabled}`}
                      aria-disabled="true"
                    >
                      Недоступно
                    </span>
                  ) : (
                    <a className={styles.primaryButton} href="#inquiry">
                      Купить
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
