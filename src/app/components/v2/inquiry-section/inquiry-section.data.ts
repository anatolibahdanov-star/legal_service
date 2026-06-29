import { type StaticImageData } from 'next/image'

import progressStep1 from '@/public/design/v2-main-page/progress-image.png'
import progressStep2 from '@/public/design/v2-main-page/progress-step2.png'
import progressStep3 from '@/public/design/v2-main-page/progress-step3.png'
import progressStep4 from '@/public/design/v2-main-page/progress-step4.png'

// TODO: шаг «Категория» временно отключён — см. StepCategoryPanel в inquiry-section.tsx
/*
import iconCourt from '@/public/design/v2-main-page/icons/icon-court.svg'
import iconRealty from '@/public/design/v2-main-page/icons/icon-realty.svg'
import iconDocs from '@/public/design/v2-main-page/icons/icon-docs.svg'
import iconDebt from '@/public/design/v2-main-page/icons/icon-debt.svg'
import iconBusiness from '@/public/design/v2-main-page/icons/icon-business.svg'
import iconOther from '@/public/design/v2-main-page/icons/icon-other.svg'
*/

export const TOTAL_VISIBLE_STEPS = 2

export interface StepMeta {
  num: number
  label: string
  progress: number
  image: StaticImageData
}

export const STEPS: StepMeta[] = [
  { num: 1, label: 'Суть проблемы',      progress: 50,  image: progressStep2 },
  // TODO: шаг «Категория» временно отключён — см. StepCategoryPanel в inquiry-section.tsx
  // { num: 2, label: 'Категория',          progress: 66,  image: progressStep4 },
  { num: 2, label: 'Контакт для связи',  progress: 99, image: progressStep4 },
]

export interface CategoryOption {
  id: string
  label: string
  icon: StaticImageData
}

// TODO: шаг «Категория» временно отключён — см. StepCategoryPanel в inquiry-section.tsx
/*
export const CATEGORIES: CategoryOption[] = [
  { id: 'court',    label: 'Судебный спор',   icon: iconCourt },
  { id: 'realty',   label: 'Недвижимость',    icon: iconRealty },
  { id: 'docs',     label: 'Документы',       icon: iconDocs },
  { id: 'debt',     label: 'Долги и кредиты', icon: iconDebt },
  { id: 'business', label: 'Бизнес',          icon: iconBusiness },
  { id: 'other',    label: 'Другое',          icon: iconOther },
]
*/

export interface Stage {
  id: string
  title: string
  sub: string
}

export const STAGES: Stage[] = [
  { id: 'new',     title: 'Только возник',    sub: 'Ищу информацию и варианты' },
  { id: 'looking', title: 'Ищу решение',      sub: 'Пытаюсь решить вопрос сам' },
  { id: 'process', title: 'Уже идёт процесс', sub: 'Обращался в гос органы или суд' },
  { id: 'urgent',  title: 'Нужно срочно',     sub: 'Есть дедлайн или риски' },
]

export interface ComplexityOption {
  id: string
  title: string
  sub: string
  dots: { color: string }[]
}

// TODO: шаг «Оценка сложности» временно отключён — см. StepComplexityPanel в inquiry-section.tsx
export const COMPLEXITY: ComplexityOption[] = [
  {
    id: 'easy',
    title: 'Простая',
    sub: 'Понятна суть вопроса, есть все документы',
    dots: [{ color: '#205246' }],
  },
  {
    id: 'medium',
    title: 'Средняя',
    sub: 'Есть нюансы, нужна консультация юриста',
    dots: [{ color: '#E9E15B' }, { color: '#E9E15B' }],
  },
  {
    id: 'hard',
    title: 'Сложная',
    sub: 'Много участников, риски, возможен суд',
    dots: [{ color: '#DE4927' }, { color: '#DE4927' }, { color: '#DE4927' }],
  },
]

export type ContactChannel = 'phone' | 'whatsapp' | 'telegram' | 'email'

export interface ChannelOption {
  id: ContactChannel
  label: string
  placeholder: string
  inputType: string
}

export const CHANNEL_OPTIONS: ChannelOption[] = [
  { id: 'phone',    label: 'Телефон',  placeholder: '+7 (___) ___-__-__', inputType: 'tel' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '+7 (___) ___-__-__', inputType: 'tel' },
  { id: 'telegram', label: 'Telegram', placeholder: '@username',           inputType: 'text' },
  { id: 'email',    label: 'Email',    placeholder: 'example@mail.ru',    inputType: 'email' },
]
