export interface CompletionItem {
  step?: string
  title: string
  description: string
  completed: boolean
}

export const COMPLETION_ITEMS: CompletionItem[] = [
  {
    title: 'Email подтверждён',
    description: 'ivan@gmail.com',
    completed: true
  },
  {
    title: 'Телефон привязан',
    description: '+7 (900) 000-00-00',
    completed: true
  },
  {
    step: '4',
    title: 'Фото профиля',
    description: 'Добавьте фото',
    completed: false
  },
  {
    step: '5',
    title: 'Документы',
    description: 'Паспорт / СНИЛС / ИНН',
    completed: false
  }
]