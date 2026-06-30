'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Gift, Plus, TrendingDown, Wallet } from 'lucide-react'
import type { DBOrder, DBUser } from '@/src/interfaces/db'
import { AlfaOrderStatusE, OrderTypeE } from '@/src/interfaces/payment'
import { CustomGetRequest, CustomRequest } from '@/src/libs/request'

interface V2ProfileBalanceProps {
  data: DBUser | null
  setUserBalance: (balance: number) => void
}

const formatRub = (value: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)

const isAlphaStatusFinal = (status: number): boolean =>
  ![AlfaOrderStatusE.Register, AlfaOrderStatusE.New, AlfaOrderStatusE.Hold].includes(status)

export function V2ProfileBalance({ data, setUserBalance }: V2ProfileBalanceProps) {
  const [newOrder, setNewOrder] = useState<DBOrder | null>(null)
  const [minTopupRub, setMinTopupRub] = useState(100)
  const [creatingOrder, setCreatingOrder] = useState(false)
  const balance = data?.balance ?? 0
  const topupKop = Math.round(minTopupRub * 100)

  useEffect(() => {
    let active = true
    const fetchMinTopup = async () => {
      const res = await CustomGetRequest('/orders/min-topup/')
      if (active && res.status && typeof res.data?.minTopupRub === 'number') {
        setMinTopupRub(res.data.minTopupRub)
      }
    }
    fetchMinTopup()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (newOrder) return
    let active = true
    const fetchCurrentOrder = async () => {
      const orderData = await CustomGetRequest('/check/')
      if (active && orderData.status) {
        setNewOrder(orderData.data)
      }
    }
    fetchCurrentOrder()
    return () => {
      active = false
    }
  }, [newOrder])

  useEffect(() => {
    if (!newOrder || isAlphaStatusFinal(newOrder.alpha_status)) return
    const intervalId = window.setInterval(async () => {
      const orderData = await CustomRequest('/status/', { slug: newOrder.alpha_id })
      if (!orderData.status || !isAlphaStatusFinal(orderData.data.alpha_status)) return

      window.clearInterval(intervalId)
      if (orderData.data.alpha_status === AlfaOrderStatusE.Auth && orderData.data.ptype === OrderTypeE.Balance) {
        setUserBalance(orderData.data.amount)
      }
      setNewOrder(null)
    }, 2000)

    return () => window.clearInterval(intervalId)
  }, [newOrder, setUserBalance])

  const handleCreateOrder = async () => {
    if (creatingOrder) return
    setCreatingOrder(true)
    const orderData = await CustomRequest('/orders/', { amount: topupKop })
    setCreatingOrder(false)
    if (orderData.status) {
      setNewOrder(orderData.data)
    }
  }

  const qrUrl = newOrder?.alpha_qr_url ?? null
  const alfaUrl = newOrder?.alpha_form_url ?? null
  const bonusProgress = Math.min(100, Math.round((balance / 10000) * 100))

  return (
    <div className="flex w-full flex-col gap-12">
      <div className="flex h-[324px] items-stretch gap-12">
        <div className="relative flex flex-1 overflow-hidden rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white p-8 shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
          <div className="relative z-[1] flex flex-1 flex-col justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00BC7D]" />
                <span className="text-[14px] font-semibold leading-5 text-[rgba(18,22,27,0.5)]">Доступный баланс</span>
              </div>
              <div className="flex w-[563px] max-w-full flex-col">
                <div className="flex items-end gap-2">
                  <span className="text-[64px] font-bold leading-[70px] text-[#12161B]">
                    {formatRub(balance)}
                  </span>
                  <span className="pb-1.5 text-[32px] font-semibold leading-[35px] tracking-[-0.02em] text-[rgba(18,22,27,0.5)]">
                    ₽
                  </span>
                </div>
                <span className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.5)]">Пополнено сегодня в 14:30</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={creatingOrder}
              className="inline-flex h-14 w-fit items-center gap-2 rounded-[35px] border border-white/15 bg-[radial-gradient(circle_at_50%_0%,#34347C_0%,#2D2D6C_100%)] px-7 pl-[22px] text-[18px] font-semibold leading-[21px] text-white shadow-[0px_4px_20px_0px_rgba(47,47,113,0.15)] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-6 w-6" />
              {creatingOrder ? 'Создаём...' : 'Пополнить'}
            </button>
          </div>
          <div className="absolute -left-12 top-[101px] h-64 w-64 rounded-full bg-[rgba(10,2,255,0.06)] blur-[64px]" />
        </div>

        <div className="flex w-[600px] shrink-0 flex-col justify-between rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white px-8 pb-5 pt-7 shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-[20px] font-semibold leading-6 tracking-[-0.01em] text-[#12161B]">История операций</h3>
              <p className="text-[12px] leading-[17px] text-[rgba(18,22,27,0.5)]">Октябрь 2023</p>
            </div>
            <button type="button" className="inline-flex items-center gap-1.5 text-[14px] font-semibold leading-5 text-[#34347C]">
              Все операции
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col">
            {[
              { title: 'Пополнение баланса', subtitle: 'Через Т-Банк', amount: '+ 15 000 ₽', date: 'Сегодня', green: true },
              { title: 'Оплата консультации', subtitle: 'Договор купли-продажи · ENK-10294', amount: '− 2 500 ₽', date: '2 дня назад' },
              { title: 'Анализ документов', subtitle: 'Договор аренды · ENK-10280', amount: '− 10 000 ₽', date: '11 дней назад' },
            ].map((item) => (
              <div key={item.title} className="flex min-h-[72px] items-center gap-4 rounded-[18px] py-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${item.green ? 'bg-[rgba(22,163,74,0.12)] text-[#16A34A]' : 'bg-gradient-to-br from-[rgba(153,153,202,0.15)] to-[rgba(165,165,221,0.15)] text-[#34347C]'}`}>
                  {item.green ? <Plus className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold leading-5 text-[#12161B]">{item.title}</p>
                  <p className="mt-0.5 truncate text-[12px] leading-[17px] text-[rgba(18,22,27,0.6)]">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-[16px] font-semibold leading-5 ${item.green ? 'text-[#16A34A]' : 'text-[#12161B]'}`}>{item.amount}</p>
                    <p className="mt-0.5 text-[12px] leading-[17px] text-[rgba(18,22,27,0.35)]">{item.date}</p>
                  </div>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 bg-[#00BC7D] text-white">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[47px]">
        {[
          { label: 'Потрачено в октябре', value: '12 500 ₽', badge: '+2 500 ₽' },
          { label: 'Активных дел', value: '3', badge: '2 завершено', green: true },
          { label: 'Сэкономлено', value: '8 000 ₽', badge: 'vs рыночная цена', green: true },
        ].map((item) => (
          <div key={item.label} className="flex flex-1 items-center justify-between rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white p-8 shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
            <div className="flex flex-col gap-0.5">
              <p className="text-[12px] font-semibold uppercase leading-[18px] tracking-[0.0417em] text-[rgba(18,22,27,0.5)]">{item.label}</p>
              <p className="text-[28px] font-semibold leading-8 tracking-[-0.01em] text-[#12161B]">{item.value}</p>
            </div>
            <span className={`inline-flex h-6 items-center gap-1 rounded-full px-3 text-[11px] font-semibold leading-[16.5px] ${item.green ? 'bg-[rgba(22,163,74,0.12)] text-[#007A55]' : 'bg-gradient-to-br from-[rgba(153,153,202,0.15)] to-[rgba(165,165,221,0.15)] text-[#34347C]'}`}>
              {item.green && <TrendingDown className="h-3 w-3" />}
              {item.badge}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] bg-[radial-gradient(circle_at_50%_0%,#34347C_0%,#2D2D6C_100%)] p-8 pb-4 text-white shadow-[0px_8px_32px_0px_rgba(124,58,237,0.25)]">
        <div className="flex flex-col gap-8">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/15 bg-white/15">
              <Gift className="h-6 w-6" />
            </div>
            <button className="h-12 rounded-[12px] border border-[rgba(18,22,27,0.1)] bg-white px-8 text-[18px] font-medium leading-[23px] text-[#34347C]">
              Получить бонус
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-[20px] font-semibold leading-6 tracking-[-0.01em]">Бонус +10%</h3>
            <p className="text-[14px] leading-5">Пополните баланс от 10 000 ₽ сегодня и получите дополнительные средства.</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-white/50" style={{ width: `${bonusProgress}%` }} />
            </div>
            <div className="flex items-center justify-between py-2 text-[12px] font-semibold uppercase leading-[18px] tracking-[0.0417em]">
              <span>{formatRub(Math.min(balance, 10000))} / 10 000 ₽</span>
              <span>{bonusProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      {newOrder && (
        <div className="rounded-[28px] border border-[rgba(18,22,27,0.05)] bg-white p-8 shadow-[0px_3px_36px_0px_rgba(0,0,0,0.04),_0px_-102px_250px_0px_rgba(0,0,0,0.07)]">
          <div className="flex items-start justify-between gap-8">
            <div>
              <h3 className="text-[20px] font-semibold leading-6 tracking-[-0.01em] text-[#12161B]">
                Завершите пополнение
              </h3>
              <p className="mt-2 text-[14px] leading-5 text-[rgba(18,22,27,0.55)]">
                Оплатите через Альфа-Банк или отсканируйте QR-код.
              </p>
              {alfaUrl && (
                <button
                  type="button"
                  onClick={() => { window.location.href = alfaUrl }}
                  className="mt-6 rounded-[18px] bg-[#12161B] px-6 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  Перейти к оплате
                </button>
              )}
            </div>

            {qrUrl && (
              <div className="rounded-[24px] bg-[#F7F6F9] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="QR-код для оплаты" className="h-[180px] w-[180px] object-contain" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
