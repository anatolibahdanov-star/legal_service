import { type StaticImageData } from 'next/image'

import stepImg1 from '@/public/design/v2-main-page/progress-image.png'
import stepImg2 from '@/public/design/v2-main-page/progress-step2.png'
import stepImg3 from '@/public/design/v2-main-page/progress-step3.png'

export const TABS: string[] = [
  'Вы оставляете обращение',
  'Анализ ситуации юристом', 
  'Подготовка ответа',
]

export interface HowItWorksStep {
  num: string
  title: string
  desc: string
}

export const STEPS: HowItWorksStep[] = [
  {
    num: '1',
    title: 'Вы задаете свой вопрос',
    desc: 'Опишите подробно свой вопрос или ситуацию. Первый запрос всегда за наш счет, у Вас должна быть возможность самостоятельно оценить качество и скорость нашего сервиса.',
  },
  {
    num: '2',
    title: 'Уточните свои контактные данные, чтобы мы знали куда направить подготовленный ответ',
    desc: 'Сервис позволяет создать удобный личный кабинет, чтобы сохранить историю всех вопросов и ответов на них.',
  },
  {
    num: '3',
    title: 'Получите уведомление о готовности ответа',
    desc: 'Мы подготовим ответ в виде отдельного файла, чтобы Вам было удобно его сохранить и использовать, когда потребуется',
  },
]

export interface ProcessStep {
  img: StaticImageData
  title: string
  desc: string
  divider: string | null
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    img: stepImg1,
    title: 'Вы задаете свой вопрос',
    desc: 'Опишите подробно свой вопрос или ситуацию. Первый запрос всегда за наш счет, у Вас должна быть возможность самостоятельно оценить качество и скорость нашего сервиса.',
    divider: 'linear-gradient(180deg, rgba(74,74,131,0.75) 0%, rgba(18,129,102,0.75) 100%)',
  },
  {
    img: stepImg2,
    title: 'Уточните свои контактные данные, чтобы мы знали куда направить подготовленный ответ',
    desc: 'Сервис позволяет создать удобный личный кабинет, чтобы сохранить историю всех вопросов и ответов на них.',
    divider: 'linear-gradient(180deg, rgba(18,129,102,0.75) 0%, rgba(237,226,28,0.75) 100%)',
  },
  {
    img: stepImg3,
    title: 'Получите уведомление о готовности ответа',
    desc: 'Мы подготовим ответ в виде отдельного файла, чтобы Вам было удобно его сохранить и использовать, когда потребуется',
    divider: null,
  },
]
