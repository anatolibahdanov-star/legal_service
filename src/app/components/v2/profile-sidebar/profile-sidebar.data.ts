export interface CompletionItem {
  key?: 'email' | 'phone' | 'photo' | 'documents'
  step?: string
  title: string
  description: string
  completed: boolean
}

export const COMPLETION_ITEMS: CompletionItem[] = [
  {
    key: 'email',
    title: 'Email подтверждён',
    description: 'ivan@gmail.com',
    completed: true
  },
  {
    key: 'phone',
    title: 'Телефон привязан',
    description: '+7 (900) 000-00-00',
    completed: true
  },
  {
    key: 'photo',
    step: '4',
    title: 'Фото профиля',
    description: 'Добавьте фото',
    completed: false
  },
  {
    key: 'documents',
    step: '5',
    title: 'Документы',
    description: 'Паспорт / СНИЛС / ИНН',
    completed: false
  }
]