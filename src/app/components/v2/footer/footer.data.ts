export interface QuickLink {
  label: string
  href: string
}

export const QUICK_LINKS: QuickLink[] = [
  { label: 'Услуги',        href: '/#services' },
  { label: 'О нас',         href: '/about' },
  { label: 'Почему мы',     href: '/#why-us' },
  { label: 'Задать вопрос', href: '/#inquiry' },
]

export const DOCUMENTS: QuickLink[] = [
  { label: 'Политика в отношении обработки персональных данных', href: '/privacy_policy' },
  { label: 'Согласие на обработку персональных данных', href: '/privacy_policy' }, // Assuming same page for now
  { label: 'Условия публичной оферты', href: '/terms_and_conditions' },
]

export const COMPANY_INFO = {
  name: 'ООО «ЭНКИ-Л»',
  ogrn: '1267700058130',
  inn: '9704269974',
  email: 'contact@enki.legal',
  description: 'Профессиональная юридическая помощь и консультации. Работаем с 2014 года. Более 5000 успешных дел.'
}
