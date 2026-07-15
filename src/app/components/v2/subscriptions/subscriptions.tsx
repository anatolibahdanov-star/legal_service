import styles from './subscriptions.module.css'

const plans = [
  {
    name: 'Разовая консультация',
    description: 'Полноценная онлайн юридическая консультация по вашему вопросу',
    oldPrice: '5600 ₽',
    price: '1000 ₽',
  },
  {
    name: 'Стандарт',
    description: 'Пакет из 5 консультаций с профессиональными юристами',
    price: '4600 ₽',
    priceSuffix: '/мес',
    note: 'за 9 000 ₽/мес',
    featured: true,
  },
  {
    name: 'Профи',
    description: 'Пакет из 10 консультаций с профессиональными юристами',
    price: '8 500 ₽',
    priceSuffix: '/мес',
    note: 'за 11 500 ₽/мес',
  },
]

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
  return (
    <section id="subscriptions" className={styles.subscriptions}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>
            Купить подписку на
            <br />
            юридические консультации
          </h2>
          <p className={styles.subtitle}>За одного пользователя</p>
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

                <div className={styles.benefit}>
                  <CheckIcon />
                  <div>
                    <p className={styles.benefitTitle}>Доступ к источникам</p>
                    <p className={styles.benefitText}>
                      Бесплатно первый месяц, далее
                      <br />
                      +3 000 ₽/мес за Гарант Лайт
                    </p>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  {plan.note ? <p className={styles.note}>{plan.note}</p> : null}
                  <a className={styles.primaryButton} href="#inquiry">
                    Купить
                  </a>
                </div>
              </article>
            ))}

            <article className={`${styles.card} ${styles.businessCard}`}>
              <div>
                <h3 className={styles.cardTitle}>Бизнес тарифы</h3>
                <p className={styles.cardDescription}>
                  Установка on-premises, расширенные пакеты или подключение групп
                </p>
              </div>

              <ul className={styles.businessList}>
                <li>Работа в контуре компании</li>
                <li>Кастомные доработки продукта</li>
                <li>Покупка лицензий на группу</li>
              </ul>

              <div className={styles.cardFooter}>
                <a className={styles.secondaryButton} href="#inquiry">
                  Оставить заявку
                </a>
                <a className={styles.primaryButton} href="#inquiry">
                  Купить
                </a>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
