'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import useEmblaCarousel from 'embla-carousel-react'
import { X } from 'lucide-react'
import { isStaffRole } from '@/src/app/components/v2/lawyer-requests/staff-gate'
import { useBodyScrollLock } from '@/src/app/hooks/useBodyScrollLock'
import { CustomGetRequest, CustomRequest } from '@/src/libs/request'
import { OrderTypeE } from '@/src/interfaces/payment'
import {
  emitOpenAuth,
  peekPendingSubscriptionPlan,
  clearPendingSubscriptionPlan,
  setPendingSubscriptionPlan,
  setPendingOneTimePurchase,
  consumePendingOneTimePurchase,
} from '@/src/libs/authIntent'
import styles from './subscriptions.module.css'

type Tone = 'orange' | 'yellow' | 'purple' | 'green'

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
  tone: Tone
  /** Subscription plan id when the card is a DB-backed monthly plan */
  planId?: number
  bvAmount?: number
}

type MySub = {
  id: number
  status: number
  planId: number | null
  planName: string | null
  priceRub: number
  bvAmount: number
  periodStart: string | null
  periodEnd: string | null
  willRenew: boolean
}

type ConfirmData = {
  plan: Plan
  title: string
  paragraphs: string[]
}

interface PublicPlanDTO {
  id: number
  name: string
  description: string | null
  price_rub: number
  bv_amount: number
  tone: string | null
  badge: string | null
  featured: boolean
}

const oneTimePlan: Plan = {
  name: 'Разовый запрос',
  description: 'Разовая оплата 1 вопроса',
  price: '2 000 ₽',
  badge: 'Один вопрос – один ответ, без подписки',
  tone: 'orange',
}

const MONTHLY_FALLBACK: Plan[] = [
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

const TONES: Tone[] = ['orange', 'yellow', 'purple', 'green']

const rubFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

const toneOf = (tone: string | null): Tone =>
  tone && (TONES as string[]).includes(tone) ? (tone as Tone) : 'purple'

const mapDtoToPlan = (dto: PublicPlanDTO): Plan => ({
  name: dto.name,
  description: dto.description ?? '',
  price: `${rubFormatter.format(dto.price_rub)} ₽`,
  priceSuffix: '/мес',
  featured: dto.featured,
  badge: dto.badge ?? '',
  tone: toneOf(dto.tone),
  planId: dto.id,
  bvAmount: dto.bv_amount,
})

const questionsWord = (n: number) => {
  const tail = Math.abs(n) % 100
  const last = tail % 10
  if (tail > 10 && tail < 15) return 'вопросов'
  if (last === 1) return 'вопрос'
  if (last >= 2 && last <= 4) return 'вопроса'
  return 'вопросов'
}

const BADGE_TONE_CLASS: Record<Tone, string> = {
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
  const [monthly, setMonthly] = useState<Plan[]>(MONTHLY_FALLBACK)
  const [buyingId, setBuyingId] = useState<number | null>(null)
  const [mySub, setMySub] = useState<MySub | null>(null)
  const [subCheck, setSubCheck] = useState<'loading' | 'ready' | 'error'>('loading')
  const [confirmData, setConfirmData] = useState<ConfirmData | null>(null)

  useBodyScrollLock(confirmData !== null)

  const buildConfirm = (plan: Plan): ConfirmData | null => {
    if (!plan.planId) return null
    if (subCheck === 'error') {
      return {
        plan,
        title: 'Подтверждение покупки',
        paragraphs: [
          'Не удалось проверить вашу текущую подписку. Если она активна, оплата изменит её условия.',
        ],
      }
    }
    if (!mySub) return null
    const end = mySub.periodEnd
      ? ` до ${new Date(mySub.periodEnd).toLocaleDateString('ru-RU')}`
      : ''
    const rearm = mySub.willRenew ? [] : ['Автопродление будет включено снова.']
    if (plan.planId === mySub.planId) {
      return {
        plan,
        title: 'Продление подписки',
        paragraphs: [
          `У вас уже подключён тариф «${mySub.planName ?? plan.name}»${end}.`,
          'Оплата продлит его ещё на месяц — неиспользованные вопросы сохранятся.',
          ...rearm,
        ],
      }
    }
    const current = `Сейчас у вас «${mySub.planName ?? 'текущий тариф'}» (${mySub.bvAmount} ${questionsWord(mySub.bvAmount)}/мес)${end}.`
    const delta = (plan.bvAmount ?? 0) - mySub.bvAmount
    if (delta < 0) {
      return {
        plan,
        title: 'Внимание: понижение тарифа',
        paragraphs: [
          current,
          `После оплаты сразу активируется «${plan.name}»: ${-delta} ${questionsWord(delta)} будет списано с баланса подписки, а оставшийся оплаченный период сгорит.`,
          ...rearm,
        ],
      }
    }
    const gain = delta > 0 ? `: добавится ${delta} ${questionsWord(delta)}` : ''
    return {
      plan,
      title: 'Смена тарифа',
      paragraphs: [
        current,
        `После оплаты сразу активируется «${plan.name}»${gain}, месячный период начнётся заново с сегодняшнего дня.`,
        ...rearm,
      ],
    }
  }

  const resumePendingRef = useRef(false)

  const goToInquiry = () => {
    const target =
      document.getElementById('m-inquiry') ?? document.getElementById('inquiry')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.location.assign('/#inquiry')
  }

  const handleOneTimeBuy = () => {
    if (isStaff) return
    if (!session?.user) {
      setPendingOneTimePurchase()
      emitOpenAuth({ form: 'login' })
      return
    }
    goToInquiry()
  }

  const doBuy = async (plan: Plan) => {
    if (!plan.planId || buyingId !== null) return
    setBuyingId(plan.planId)
    try {
      const res = await CustomRequest('/orders/', {
        type: OrderTypeE.Subscription,
        amount: 0,
        data: { planId: plan.planId },
      })
      if (res.status && res.data?.alpha_form_url) {
        clearPendingSubscriptionPlan()
        window.location.href = res.data.alpha_form_url
        return
      }
      setBuyingId(null)
      alert(res.error || 'Не удалось создать платёж. Попробуйте ещё раз.')
    } catch {
      setBuyingId(null)
      alert('Техническая ошибка. Попробуйте ещё раз.')
    }
  }

  /** Same path for manual buy and post-login resume: confirm when needed, else pay. */
  const startBuyForPlan = (plan: Plan) => {
    if (!plan.planId || buyingId !== null) return
    const confirm = buildConfirm(plan)
    if (confirm) {
      setConfirmData(confirm)
      return
    }
    void doBuy(plan)
  }

  const handleBuy = (plan: Plan) => {
    if (!plan.planId || buyingId !== null) return
    if (!session?.user) {
      setPendingSubscriptionPlan(plan.planId)
      emitOpenAuth({ form: 'login' })
      return
    }
    startBuyForPlan(plan)
  }

  useEffect(() => {
    let cancelled = false
    CustomGetRequest('/subscriptions/public')
      .then((res) => {
        const list = (res?.data?.plans ?? []) as PublicPlanDTO[]
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setMonthly(list.map(mapDtoToPlan))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!session?.user || isStaff) {
      setMySub(null)
      setSubCheck('ready')
      return
    }
    let cancelled = false
    setSubCheck('loading')
    CustomGetRequest('/subscriptions/me')
      .then((res) => {
        if (cancelled) return
        if (res?.status) {
          setMySub((res.data?.subscription as MySub | null) ?? null)
          setSubCheck('ready')
        } else {
          setMySub(null)
          setSubCheck('error')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMySub(null)
          setSubCheck('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [session?.user?.id, isStaff])

  // Guest chose a plan → logged in/registered → resume (with confirm if they already have a sub).
  useEffect(() => {
    if (!session?.user || isStaff) return
    if (subCheck === 'loading' || buyingId !== null || resumePendingRef.current) return
    const pendingId = peekPendingSubscriptionPlan()
    if (!pendingId) return
    // Wait until DB-backed plans (with planId) are loaded — fallback cards have none.
    const dbPlans = monthly.filter((item) => item.planId != null)
    if (dbPlans.length === 0) return
    const plan = dbPlans.find((item) => item.planId === pendingId)
    if (!plan) {
      clearPendingSubscriptionPlan()
      return
    }
    resumePendingRef.current = true
    clearPendingSubscriptionPlan()
    document.getElementById('subscriptions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    startBuyForPlan(plan)
    resumePendingRef.current = false
  }, [session?.user?.id, isStaff, subCheck, buyingId, monthly])

  // Guest chose one-time package → after auth, open the inquiry wizard.
  useEffect(() => {
    if (!session?.user || isStaff) return
    if (!consumePendingOneTimePurchase()) return
    goToInquiry()
  }, [session?.user?.id, isStaff])

  const plans: Plan[] = [oneTimePlan, ...monthly]

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
  }, [emblaApi, onSelect, plans.length])

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index)
    },
    [emblaApi],
  )

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
              Разовый запрос или ежемесячные подписки с разным количеством запросов.
              <br/>
               Выбирайте подходящий именно вам вариант. 
               <br/>
              При ежемесячной подписке неиспользованные запросы не сгорают и переносятся на следующий месяц
            </p>
            {/* <p className={styles.subtitle}>
              Лицензия на месяц предоставляется для 1 пользователя.
            </p> */}
          </div>
        </header>

        <div className={styles.carousel}>
          <div className={styles.cardsViewport} ref={emblaRef}>
            <div className={styles.cards}>
              {plans.map((plan) => {
                const isCurrent = plan.planId != null && mySub?.planId === plan.planId
                return (
                <div key={plan.planId ?? plan.name} className={styles.slide}>
                <article
                  className={`${styles.card} ${plan.featured ? styles.featuredCard : ''} ${isCurrent ? styles.currentCard : ''}`}
                >
                  {isCurrent ? (
                    <span className={`${styles.featuredLabel} ${styles.currentLabel}`}>
                      Ваш тариф
                    </span>
                  ) : plan.featured ? (
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
                    ) : plan.planId ? (
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => handleBuy(plan)}
                        disabled={buyingId !== null || (!!session?.user && subCheck === 'loading')}
                      >
                        {buyingId === plan.planId
                          ? 'Создаём платёж…'
                          : isCurrent
                            ? 'Продлить'
                            : 'Купить'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={handleOneTimeBuy}
                      >
                        Купить
                      </button>
                    )}
                  </div>
                </article>
                </div>
                )
              })}
            </div>
          </div>

          {scrollSnaps.length > 1 ? (
            <div className={styles.dots} role="tablist" aria-label="Тарифы">
              {scrollSnaps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === selectedIndex}
                  aria-label={`Тариф ${i + 1}`}
                  className={`${styles.dot} ${i === selectedIndex ? styles.dotActive : ''}`}
                  onClick={() => scrollTo(i)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {confirmData ? (
        <div className={styles.modalOverlay} onClick={() => setConfirmData(null)}>
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-confirm-title"
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setConfirmData(null)}
              aria-label="Закрыть"
            >
              <X className={styles.modalCloseIcon} />
            </button>
            <h3 id="subscription-confirm-title" className={styles.modalTitle}>
              {confirmData.title}
            </h3>
            {confirmData.paragraphs.map((text) => (
              <p key={text} className={styles.modalText}>
                {text}
              </p>
            ))}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setConfirmData(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={() => {
                  const plan = confirmData.plan
                  setConfirmData(null)
                  void doBuy(plan)
                }}
              >
                Продолжить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
