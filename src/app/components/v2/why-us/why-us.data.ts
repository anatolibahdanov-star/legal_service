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
    title: 'Сервис организован следующим образом:',
    desc: [
      '— Пользователь задает вопрос',
      '— ИИ подготавливает проект ответа',
      '— Практикующий юрист проверяет и дорабатывает его',
      '— Финальный ответ подписывается специалистом',
    ].join('\n'),
    textColor: '#fff',
  },
  {
    bg: '#D8D054',
    iconBg: '#E9E15B',
    icon: iconWhyUs2,
    title: 'Каждый ответ:',
    desc: [
      '— Проверяется практикующим юристом',
      '— Подписывается специалистом',
      '— Оформляется в виде письменного документа',
    ].join('\n'),
    textColor: '#12161B',
  },
  {
    bg: '#C44021',
    iconBg: '#DE4927',
    icon: iconWhyUs3,
    title: 'В результате',
    desc: 'Пользователь получает понятный, проверенный и юридически корректный ответ, который можно использовать в реальной ситуации',
    textColor: '#fff',
  },
  {
    bg: '#183E35',
    iconBg: '#205246',
    icon: iconWhyUs4,
    title: 'При этом:',
    desc: [
      '— Обеспечивается полная конфиденциальность сведений, передаваемых пользователем ЭНКИ,',
      '— Профессиональная ответственность ЭНКИ застрахована перед каждым пользователем в компании Ресо (полис к страховке).',
    ].join('\n'),
    textColor: '#fff',
  },
]
