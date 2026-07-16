export interface NavLink {
  label: string
  href: string
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Задать вопрос',    href: '/#inquiry' },
  { label: 'Тарифы',           href: '/#subscriptions' },
  { label: 'Как это работает', href: '/#how-it-works' },
]
