export interface NavLink {
  label: string
  href: string
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Задать вопрос',    href: '/#inquiry' },
  { label: 'Тарифы',           href: '/#subscriptions' },
  { label: 'Почему мы',        href: '/#why-us' },
  { label: 'Как мы работаем', href: '/#how-it-works' },
]
