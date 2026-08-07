'use client'

import Image from 'next/image'
import { AlertCircle, Check } from 'lucide-react'

import finalCubeImg from '@/public/design/v2-main-page/progress-final.png'
import styles from './payment-result.module.css'

export type PaymentResultKind = 'balance' | 'subscription' | 'one_time'

export interface PaymentResultProps {
  kind: PaymentResultKind
  paid: boolean
  amount?: number | null
  secondsLeft?: number | null
  onPrimary: () => void
}

const formatRub = (n: number): string => new Intl.NumberFormat('ru-RU').format(n)

function buildCopy(kind: PaymentResultKind, paid: boolean, amount?: number | null) {
  const amountLine =
    typeof amount === 'number' && amount > 0
      ? `С карты успешно списано ${formatRub(amount)} ₽`
      : null

  if (kind === 'subscription') {
    return {
      badge: paid ? 'Подписка активна' : 'Платёж не выполнен',
      title: paid ? 'Подписка оформлена' : 'Платёж не прошёл',
      paragraphs: paid
        ? [
            amountLine ?? 'Платёж картой прошёл успешно.',
            'Тариф активирован, бесплатные вопросы начислены. Управлять подпиской можно в Личном кабинете.',
          ]
        : [
            'Деньги не списаны — подписка не оформлена.',
            'Вы можете попробовать оформить подписку ещё раз.',
          ],
      primary: paid ? 'Перейти в Личный кабинет' : 'Попробовать ещё раз',
    }
  }

  if (kind === 'one_time') {
    return {
      badge: paid ? 'Оплата подтверждена' : 'Платёж не выполнен',
      title: paid ? 'Ваш вопрос принят' : 'Платёж не прошёл',
      paragraphs: paid
        ? [
            amountLine ?? 'Платёж картой прошёл успешно.',
            'Ваш вопрос сохранён и отправлен на рассмотрение юристу. Ответ придёт в Личный кабинет и на вашу электронную почту.',
          ]
        : [
            'Деньги не списаны — статус заказа не изменён.',
            'Вопрос сохранён в Личном кабинете как неоплаченный. Вы можете попробовать оплатить его ещё раз в разделе «Ваши заявки».',
          ],
      primary: paid ? 'Перейти к моим вопросам' : 'Попробовать ещё раз',
    }
  }

  return {
    badge: paid ? 'Баланс пополнен' : 'Платёж не выполнен',
    title: paid ? 'Баланс успешно пополнен' : 'Не удалось выполнить платёж',
    paragraphs: paid
      ? [
          'Деньги будут зачислены на ваш счёт в течение нескольких минут. После этого вы сможете оплатить консультацию юриста или задать вопрос.',
        ]
      : [
          'Что-то пошло не так. Деньги не списаны или платёж не завершён.',
          'Попробуйте ещё раз или выберите другой способ оплаты.',
        ],
    primary: 'Вернуться к странице Баланса',
  }
}

export function PaymentResult({
  kind,
  paid,
  amount = null,
  secondsLeft = null,
  onPrimary,
}: PaymentResultProps) {
  const copy = buildCopy(kind, paid, amount)
  const footnote =
    paid && secondsLeft !== null && secondsLeft > 0
      ? `Автоматический переход через ${secondsLeft} с`
      : paid && kind === 'balance'
        ? 'Если платёж отображается с задержкой — обновите страницу или проверьте баланс позже.'
        : ''

  return (
    <div className={`v2-header-bleed ${styles.page}`}>
      <div className={`${styles.card} ${paid ? '' : styles.cardError}`}>
        <div aria-hidden className={`${styles.blur} ${paid ? '' : styles.blurError}`} />

        <div className={styles.inner}>
          <span className={`${styles.badge} ${paid ? styles.badgeSuccess : styles.badgeError}`}>
            {paid ? <Check size={14} strokeWidth={2.5} /> : <AlertCircle size={14} strokeWidth={2} />}
            {copy.badge}
          </span>

          <h1 className={styles.title}>{copy.title}</h1>

          {paid && typeof amount === 'number' && amount > 0 && kind === 'balance' ? (
            <p className={styles.amount}>{formatRub(amount)} ₽</p>
          ) : null}

          <div className={styles.paragraphs}>
            {copy.paragraphs.map((text) => (
              <p key={text} className={styles.paragraph}>
                {text}
              </p>
            ))}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.primaryBtn} onClick={onPrimary}>
              {copy.primary}
            </button>
            {footnote ? <p className={styles.footnote}>{footnote}</p> : null}
          </div>
        </div>

        {paid ? (
          <div className={styles.imageWrap}>
            <Image
              src={finalCubeImg}
              alt="Платёж успешен"
              fill
              className={styles.containImage}
              priority
            />
          </div>
        ) : (
          <div className={styles.errorIcon} aria-hidden>
            <AlertCircle size={40} strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  )
}

export function PaymentResultLoading() {
  return (
    <div className={`v2-header-bleed ${styles.page}`}>
      <div className={styles.card}>
        <div aria-hidden className={styles.blur} />
        <p className={styles.loading}>Проверяем статус платежа…</p>
      </div>
    </div>
  )
}
