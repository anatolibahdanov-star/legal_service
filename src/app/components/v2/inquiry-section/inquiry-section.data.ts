import { type StaticImageData } from 'next/image'

import progressStep1 from '@/public/design/v2-main-page/progress-image.png'
import progressStep2 from '@/public/design/v2-main-page/progress-step2.png'
import progressStep3 from '@/public/design/v2-main-page/progress-step3.png'
import progressStep4 from '@/public/design/v2-main-page/progress-step4.png'

export const TOTAL_VISIBLE_STEPS = 3

export interface StepMeta {
  num: number
  label: string
  progress: number
  image: StaticImageData
}

export const STEPS: StepMeta[] = [
  { num: 1, label: 'Суть проблемы',      progress: 33,  image: progressStep2 },
  { num: 2, label: 'Оценка сложности',   progress: 66,  image: progressStep4 },
  { num: 3, label: 'Контакт для связи',  progress: 100, image: progressStep4 },
]

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
