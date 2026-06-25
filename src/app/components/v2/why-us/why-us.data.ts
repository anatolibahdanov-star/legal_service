import { type StaticImageData } from 'next/image'

import iconWhyUs1 from '@/public/design/v2-main-page/icons/icon-why-us-1.svg'
import iconWhyUs2 from '@/public/design/v2-main-page/icons/icon-why-us-2.svg'
import iconWhyUs3 from '@/public/design/v2-main-page/icons/icon-why-us-3.svg'
import iconWhyUs4 from '@/public/design/v2-main-page/icons/icon-why-us-4.svg'

export interface WhyUsCard {
  bg: string
  iconBg: string
  icon: StaticImageData
  title: string
  desc: string
  textColor: string
}

export const CARDS: WhyUsCard[] = [
  {
    bg: '#34347C',
    iconBg: '#4242A1',
    icon: iconWhyUs1,
    title: 'Экспертиза в юридических вопросах',
    desc: 'Решаем широкий спектр задач: сделки с недвижимостью, имущественные права. Опыт позволяет сопровождать как стандартные, так и сложные операции.',
    textColor: '#fff',
  },
  {
    bg: '#D8D054',
    iconBg: '#E9E15B',
    icon: iconWhyUs2,
    title: 'Взвешенный подход к каждому делу',
    desc: 'Анализируем документы и риски. Готовим полноценный ответ на фирменном бланке',
    textColor: '#12161B',
  },
  {
    bg: '#C44021',
    iconBg: '#DE4927',
    icon: iconWhyUs3,
    title: 'Работаем только на хороший результат',
    desc: 'Только опытные и проверенные юристы. Ответственность застрахована. Выдерживаем сроки',
    textColor: '#fff',
  },
  {
    bg: '#183E35',
    iconBg: '#205246',
    icon: iconWhyUs4,
    title: 'Оперативная консультация онлайн',
    desc: 'Без лишних слов и просьб перезвонить',
    textColor: '#fff',
  },
]
