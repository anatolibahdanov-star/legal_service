import { LEGAL_DOCUMENTS, type LegalDocumentKey } from '@/src/app/components/legalDocuments'

export interface QuickLink {
  label: string
  href: string
}

export interface DocumentLink {
  label: string
  href: string
}

export const QUICK_LINKS: QuickLink[] = [
  { label: 'Задать вопрос',    href: '/#inquiry' },
  { label: 'Тарифы',           href: '/#subscriptions' },
  { label: 'Как это работает', href: '/#how-it-works' },
]

export const DOCUMENT_KEYS: LegalDocumentKey[] = [
  'privacy-policy',
  'personal-data-consent',
  'public-offer',
  'insurance-policy',
]

export const DOCUMENTS: DocumentLink[] = DOCUMENT_KEYS.map((key) => ({
  label: LEGAL_DOCUMENTS[key].title,
  href: LEGAL_DOCUMENTS[key].src,
}))

export const COMPANY_INFO = {
  name: 'ООО «ЭНКИ-Л»',
  ogrn: '1267700058130',
  inn: '9704269974',
  email: 'contact@enki.legal',
}
