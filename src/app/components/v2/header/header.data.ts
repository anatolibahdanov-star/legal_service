import telegram from '@/public/design/v2-main-page/icons/telegram.svg'
import whatsapp from '@/public/design/v2-main-page/icons/whatsapp.svg'
import phone from '@/public/design/v2-main-page/icons/phone.svg'
import { type StaticImageData } from 'next/image'

export interface NavLink {
  label: string
  href: string
}

export interface SocialLink {
  src: StaticImageData
  alt: string
  href: string
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Задать вопрос',    href: '/#inquiry' },
  { label: 'Почему мы',        href: '/#why-us' },
  { label: 'Как мы работаем', href: '/#how-it-works' },
  // { label: 'О нас',            href: '/about' },
]

export const SOCIAL_LINKS: SocialLink[] = [
  { src: telegram, alt: 'Telegram', href: 'https://t.me/enki_legal' },
  { src: whatsapp, alt: 'WhatsApp', href: 'https://wa.me/79991234567' },
  { src: phone,    alt: 'Телефон',  href: 'tel:+79991234567' },
]
