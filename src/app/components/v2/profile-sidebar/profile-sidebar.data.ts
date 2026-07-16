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
    title: 'Email',
    description: 'Привязать email',
    completed: false
  },
  {
    key: 'phone',
    title: 'Привязать телефон',
    description: 'Привязать телефон',
    completed: false
  },
  {
    key: 'photo',
    title: 'Фото профиля',
    description: 'Привязать фото',
    completed: false
  }
]