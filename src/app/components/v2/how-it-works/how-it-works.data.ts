import { type StaticImageData } from 'next/image'

import stepImg1 from '@/public/design/v2-main-page/progress-image.png'
import stepImg2 from '@/public/design/v2-main-page/progress-step2.png'
import stepImg3 from '@/public/design/v2-main-page/progress-step3.png'
import stepImg4 from '@/public/design/v2-main-page/progress-step4.png'

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
    title: 'Задайте вопрос',
    desc: 'Подробно опишите ваш вопрос, при наличии прикрепите документы',
  },
  {
    num: '2',
    title: 'Оставьте контактные данные',
    desc: 'Для новых клиентов проводим первую консультацию бесплатно',
  },
  {
    num: '3',
    title: 'Получите уведомление о готовности ответа',
    desc: 'Вы сможете посмотреть ответ на сайте, а также скачать pdf версию ответа на официальном бланке',
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
