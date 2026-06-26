'use client'

import Image from 'next/image'
import illustration from '@/public/design/v2-main-page/how-it-works-illustration.png'
import { TABS, STEPS } from './how-it-works.data'

export function HowItWorks() {

  return (
    <section
      id="how-it-works"
      className="w-full flex flex-col gap-16"
      style={{ background: '#F9F9F9', padding: '46px 0', minHeight: 779 }}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 lg:px-[100px]">
        <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-[48px] font-semibold leading-[56px] tracking-tight text-[#12161B]">
            Как мы работаем
          </h2>
          <p className="text-[22px] leading-[28px] tracking-tight text-[#12161B]">
            Профессиональный правовой аудит{' '}
            <span className="font-semibold text-[#34347C]">без лишних звонков</span>
          </p>
        </div>
        <div className="flex items-center gap-0 bg-[#E8E8E8] rounded-[14px] w-fit mb-[64px]">
          {TABS.map((tab, index) => {
            const isActive = index === 0 // Только первый таб активен (по дизайну)
            
            return (
              <div 
                key={index} 
                className="relative flex items-center justify-center"
              >
                {isActive ? (
                  <div className="relative flex items-center justify-center">
                    <svg 
                      width="309" 
                      height="48" 
                      viewBox="0 0 309 48" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="block"
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
                    <div className="absolute inset-0 flex items-center justify-center px-6 text-[16px] font-medium leading-tight text-white text-center">
                      {tab}
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-3 h-12 flex items-center justify-center text-[16px] font-medium leading-tight text-[#6B7280] text-center whitespace-nowrap">
                    {tab}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-8 flex-1">
        <div className="flex flex-col gap-[30px] flex-1">
          {STEPS.map((step) => (
            <div key={step.num} className="flex items-start gap-4">
              <span
                className="font-semibold leading-[84px] shrink-0 select-none"
                style={{
                  fontSize: 72,
                  letterSpacing: '-0.01em',
                  color: 'rgba(18,22,27,0.15)',
                  opacity: 0.8,
                  width: 44,
                }}
              >
                {step.num}
              </span>
              <div className="flex flex-col gap-2">
                <h4 className="text-[20px] font-semibold leading-6 tracking-tight text-[#12161B]">
                  {step.title}
                </h4>
                <p className="text-[16px] leading-[22px] tracking-tight text-[#12161B]" style={{ height: 42 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="relative shrink-0 rounded-3xl overflow-hidden"
          style={{ width: 560, alignSelf: 'stretch' }}
        >
          <Image
            src={illustration}
            alt="How it works illustration"
            fill
            className="object-contain"
          />
        </div>
        </div>
      </div>
    </section>
  )
}
