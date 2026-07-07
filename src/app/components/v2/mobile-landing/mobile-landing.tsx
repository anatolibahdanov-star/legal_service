'use client'

import { Fragment, useState } from 'react'
import Image from 'next/image'
import { Clock, FileText, Globe } from 'lucide-react'

import heroImage from '@/public/design/v2-main-page/hero-image.jpg'
import cubeImg from '@/public/design/v2-main-page/progress-step4.png'
import stepImg1 from '@/public/design/v2-main-page/progress-image.png'
import stepImg2 from '@/public/design/v2-main-page/progress-step2.png'
import stepImg3 from '@/public/design/v2-main-page/progress-step3.png'
import stepImg4 from '@/public/design/v2-main-page/progress-step4.png'
import iconWhyUs1 from '@/public/design/v2-main-page/icons/icon-why-us-1.svg'
import iconWhyUs2 from '@/public/design/v2-main-page/icons/icon-why-us-2.svg'
import iconWhyUs3 from '@/public/design/v2-main-page/icons/icon-why-us-3.svg'
import iconWhyUs4 from '@/public/design/v2-main-page/icons/icon-why-us-4.svg'

import { InquirySection } from '../inquiry-section/inquiry-section'

const CARD_SHADOW =
  '0px 3px 36px 0px rgba(0,0,0,0.04), 0px -102px 250px 0px rgba(0,0,0,0.07)'

const PILLS = [
  { icon: FileText, label: '5 шагов' },
  { icon: Clock, label: '2 минуты' },
  { icon: Globe, label: 'Онлайн' },
]

const PROCESS_STEPS = [
  {
    img: stepImg1,
    title: 'Опишите вашу ситуацию',
    desc: 'Опишите вопрос, обстоятельства и ваш статус.',
    divider: 'linear-gradient(180deg, rgba(74,74,131,0.75) 0%, rgba(18,129,102,0.75) 100%)',
  },
  {
    img: stepImg2,
    title: 'Укажите стадию, вопроса',
    desc: 'Проверка документов, суд или обжалование.',
    divider: 'linear-gradient(180deg, rgba(18,129,102,0.75) 0%, rgba(237,226,28,0.75) 100%)',
  },
  {
    img: stepImg3,
    title: 'Обращение онлайн',
    desc: 'Прием заявок круглосуточно и без личного визита в офис.',
    divider: 'linear-gradient(180deg, rgba(237,226,28,0.75) 0%, rgba(219,62,24,0.75) 100%)',
  },
  {
    img: stepImg4,
    title: 'Получите ответ онлайн',
    desc: 'Следите за дальнейшими действиями по вашему делу.',
    divider: null,
  },
]

const WHY_US = [
  {
    bg: '#34347C',
    iconBg: '#4242A1',
    icon: iconWhyUs1,
    title: 'Экспертиза и опыт',
    desc: 'Более 5000 успешных дел и глубокая практика в сфере недвижимости, семейного и гражданского права.',
    textColor: '#fff',
  },
  {
    bg: '#D8D054',
    iconBg: '#E9E15B',
    icon: iconWhyUs2,
    title: 'Индивидуальный подход',
    desc: 'Анализируем детали вашей ситуации и предлагаем стратегию, адаптированную под ваши цели.',
    textColor: '#12161B',
  },
  {
    bg: '#C44021',
    iconBg: '#DE4927',
    icon: iconWhyUs3,
    title: 'Прозрачный процесс',
    desc: 'Вы всегда видите статус обращения и можете общаться с юристом напрямую в личном кабинете.',
    textColor: '#fff',
  },
  {
    bg: '#183E35',
    iconBg: '#205246',
    icon: iconWhyUs4,
    title: 'Наши услуги',
    desc: 'Комплексная правовая поддержка на каждом этапе решения вопроса.',
    textColor: '#fff',
  },
]

const SERVICES = [
  {
    num: '1',
    bg: '#4242A1',
    title: 'Консультации и анализ',
    desc: 'Оценка ситуации, рисков и перспектив с рекомендациями по дальнейшим действиям.',
  },
  {
    num: '2',
    bg: '#DE4927',
    title: 'Защита на всех стадиях',
    desc: 'Представительство в судах, участие в переговорах и сопровождение процессов.',
  },
  {
    num: '3',
    bg: '#205246',
    title: 'Документы и сопровождение',
    desc: 'Подготовка договоров, жалоб, исков, претензий и других юридических документов.',
  },
]

export function MobileLanding() {
  const [showQuiz, setShowQuiz] = useState(false)

  return (
    <div className="lg:hidden">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative h-[480px] w-full overflow-hidden md:h-[560px]">
        <Image
          src={heroImage}
          alt="ENKI hero background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 45%), linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 55%)',
          }}
        />
        <div className="relative z-[1] flex h-full flex-col justify-end px-4 pb-[176px] md:px-8 md:pb-[200px]">
          <h1 className="max-w-[520px] text-[28px] font-semibold leading-[32px] tracking-[-0.01em] text-white md:text-[36px] md:leading-[42px]">
            Задавайте вопросы опытным юристам онлайн
          </h1>
        </div>
      </section>

      {/* ─── Content ──────────────────────────────────────────── */}
      <div className="relative -mt-[164px] mx-auto flex w-full max-w-[834px] flex-col gap-10 rounded-t-[32px] bg-[#F9F9F9] px-4 pb-10 pt-4 md:-mt-[180px] md:gap-12 md:px-8 md:pb-12">
        {/* Inquiry */}
        <div id="m-inquiry" className="flex flex-col gap-4 scroll-mt-24">
          {showQuiz ? (
            <InquirySection variant="inline" onClose={() => setShowQuiz(false)} />
          ) : (
            <div
              className="relative overflow-hidden rounded-[24px] border border-[rgba(18,22,27,0.05)] bg-white px-4 pb-4 pt-2.5 md:px-6 md:pb-6 md:pt-4"
              style={{ boxShadow: CARD_SHADOW }}
            >
              <div className="relative z-[1] flex flex-col gap-3 md:gap-4">
                <h2 className="text-[24px] font-semibold leading-[30px] tracking-[-0.01em] text-[#12161B] md:text-[28px] md:leading-[32px]">
                  Реши свою проблему
                </h2>
                <div className="flex flex-col gap-8">
                  <p className="max-w-[220px] text-[14px] leading-5 text-[rgba(18,22,27,0.6)] md:max-w-[340px] md:text-[16px] md:leading-[22px]">
                    Ответьте здесь на наши пять вопросов и мы подберём вам юриста и дадим вам личные
                    рекомендации.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowQuiz(true)}
                    className="flex h-10 w-full items-center justify-center rounded-[35px] border border-[rgba(255,255,255,0.5)] text-[14px] font-medium leading-[18px] text-white transition-opacity cursor-pointer hover:opacity-90 active:opacity-80 md:h-12 md:max-w-[320px] md:text-[16px]"
                    style={{
                      background: 'radial-gradient(circle at 50% 0%, #34347C 0%, #2D2D6C 100%)',
                    }}
                  >
                    Начать консультацию
                  </button>
                </div>
              </div>
              <Image
                src={cubeImg}
                alt=""
                width={140}
                height={172}
                className="pointer-events-none absolute right-0 top-[52px] h-[172px] w-[140px] object-contain md:right-2 md:top-[48px] md:h-[200px] md:w-[160px]"
              />
            </div>
          )}

          {/* Pills */}
          <div className="flex items-center gap-2 md:gap-3">
            {PILLS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[rgba(18,22,27,0.08)] bg-white pl-3 pr-3.5 md:h-11"
                style={{ boxShadow: CARD_SHADOW }}
              >
                <Icon className="h-4 w-4 shrink-0 text-[#12161B]" strokeWidth={1.6} />
                <span className="text-[14px] leading-5 text-[#12161B]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <section id="m-how-it-works" className="flex flex-col gap-8 scroll-mt-24 md:gap-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-[24px] font-semibold leading-[30px] tracking-[-0.01em] text-[#12161B] md:text-[28px] md:leading-[32px]">
              Как это работает
            </h2>
            <p className="text-[16px] leading-[22px] tracking-[-0.01em] text-[#12161B] md:text-[18px] md:leading-6">
              Прозрачный и понятный процесс{' '}
              <span className="font-semibold text-[#34347C]">онлайн-консультации</span>
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            {PROCESS_STEPS.map((step) => (
              <Fragment key={step.title}>
                <div
                  className="flex items-start gap-4 rounded-[24px] border border-[rgba(18,22,27,0.05)] bg-white p-4"
                  style={{ boxShadow: CARD_SHADOW }}
                >
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[12px]">
                    <Image src={step.img} alt="" fill className="object-contain" />
                  </div>
                  <div className="flex flex-col gap-2 pt-1.5">
                    <h4 className="text-[16px] font-semibold leading-5 text-[#12161B]">
                      {step.title}
                    </h4>
                    <p className="text-[16px] leading-[22px] text-[#12161B]">{step.desc}</p>
                  </div>
                </div>
                {step.divider && (
                  <div className="pl-[52px]">
                    <div
                      className="h-6 w-0 border-l-2 border-dashed"
                      style={{ borderImage: `${step.divider} 1` }}
                    />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </section>

        {/* Why us */}
        <section id="m-why-us" className="flex flex-col gap-8 scroll-mt-24 md:gap-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-[24px] font-semibold leading-[30px] tracking-[-0.01em] text-[#12161B] md:text-[28px] md:leading-[32px]">
              Почему выбирают нас?
            </h2>
            <p className="text-[16px] leading-[22px] text-[#12161B] md:text-[18px] md:leading-6">
              Объединяем юридическую экспертизу и современные технологии для быстрого решения
              вопросов.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Phone: horizontal scroll */}
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {WHY_US.map((card) => (
                <div
                  key={card.title}
                  className="flex w-[250px] shrink-0 flex-col gap-6 rounded-[24px] border border-[rgba(255,255,255,0.15)] p-3"
                  style={{ background: card.bg, boxShadow: '0px 2px 6px 0px rgba(30,47,72,0.06)' }}
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-[12px] border border-[rgba(255,255,255,0.15)]"
                    style={{ background: card.iconBg }}
                  >
                    <Image src={card.icon} alt="" width={48} height={48} />
                  </div>
                  <div className="flex flex-col gap-4">
                    <p
                      className="text-[16px] font-semibold leading-5"
                      style={{ color: card.textColor }}
                    >
                      {card.title}
                    </p>
                    <p className="text-[14px] leading-5" style={{ color: card.textColor }}>
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet: 2-column grid */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-4">
              {WHY_US.map((card) => (
                <div
                  key={card.title}
                  className="flex flex-col gap-6 rounded-[24px] border border-[rgba(255,255,255,0.15)] p-4"
                  style={{ background: card.bg, boxShadow: '0px 2px 6px 0px rgba(30,47,72,0.06)' }}
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-[12px] border border-[rgba(255,255,255,0.15)]"
                    style={{ background: card.iconBg }}
                  >
                    <Image src={card.icon} alt="" width={48} height={48} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <p
                      className="text-[16px] font-semibold leading-5"
                      style={{ color: card.textColor }}
                    >
                      {card.title}
                    </p>
                    <p className="text-[14px] leading-5" style={{ color: card.textColor }}>
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 md:hidden">
              {WHY_US.map((card, i) => (
                <span
                  key={card.title}
                  className={`h-2 rounded-full transition-all ${
                    i === 0 ? 'w-4 bg-[#34347C]' : 'w-2 bg-[rgba(18,22,27,0.15)]'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="flex flex-col gap-8 md:gap-10">
          <div className="flex flex-col gap-3">
            <h2 className="text-[24px] font-semibold leading-[30px] tracking-[-0.01em] text-[#12161B] md:text-[28px] md:leading-[32px]">
              Какие услуги предоставляем?
            </h2>
            <p className="text-[16px] leading-[22px] text-[#12161B] md:text-[18px] md:leading-6">
              Комплексная правовая защита на{' '}
              <span className="font-semibold text-[#34347C]">каждом этапе</span> любого дела
            </p>
          </div>

          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4">
            {SERVICES.map((service, index) => (
              <div
                key={service.num}
                className={`flex items-stretch gap-6 rounded-[24px] border border-[rgba(255,255,255,0.15)] py-4 pl-6 pr-4 ${index === SERVICES.length - 1 ? 'md:col-span-2' : ''}`}
                style={{ background: service.bg, boxShadow: CARD_SHADOW }}
              >
                <div className="flex w-10 shrink-0 items-center justify-center">
                  <span className="text-[64px] font-semibold leading-[70px] text-[rgba(255,255,255,0.6)]">
                    {service.num}
                  </span>
                </div>
                <div className="flex flex-col justify-center gap-2 py-2">
                  <p className="text-[16px] font-semibold leading-5 text-white">{service.title}</p>
                  <p className="text-[16px] leading-[22px] text-white">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
