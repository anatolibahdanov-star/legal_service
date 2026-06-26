'use client'

import Image from 'next/image'
import { CARDS } from './why-us.data'

export function WhyUs() {
  return (
    <section
      id="why-us"
      className="w-full flex flex-col gap-14"
      style={{ background: '#F9F9F9', padding: '46px 0' }}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-[100px]">
        <div className="flex items-start gap-4">
        <div className="flex flex-col gap-4 flex-1">
          <h2 className="text-[48px] font-semibold leading-[56px] tracking-tight text-[#12161B]">
            Почему мы?
          </h2>
          <p className="text-[22px] leading-[28px] tracking-tight text-[#12161B] mb-[56px]">
          Опытная команда штатных юристов онлайн 24/7 . Вы получите полноценную юридическую консультацию онлайн без звонков и визитов в офис.  Ответственность за результат застрахована
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {CARDS.map((card, i) => (
          <div
            key={i}
            className="flex flex-col gap-3"
            style={{
              padding: 12,
              borderRadius: 21.32,
              background: card.bg,
              border: '0.38px solid rgba(18,22,27,0.1)',
              boxShadow: '0px 2px 6px 0px rgba(30,47,72,0.06)',
              minHeight: 350,
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 80,
                height: 80,
                borderRadius: 10,
                background: card.iconBg,
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <Image src={card.icon} alt={card.title} width={48} height={48} />
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <p
                className="text-[22px] font-semibold leading-7 tracking-tight"
                style={{ color: card.textColor }}
              >
                {card.title}
              </p>
              <p
                className="text-[16px] leading-[22px] tracking-tight flex-1"
                style={{ color: card.textColor }}
              >
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}
