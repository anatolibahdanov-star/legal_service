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
    step: '1',
    title: 'Email',
    description: 'Привязать email',
    completed: false,
  },
  {
    key: 'phone',
    step: '2',
    title: 'Телефон не подтверждён',
    description: 'Привязать телефон',
    completed: false,
  },
  {
    key: 'photo',
    step: '3',
    title: 'Нет фото',
    description: 'Добавить фото',
    completed: false,
  },
]