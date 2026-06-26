export interface ProfileField {
  label: string
  value: string
}

export const PERSONAL_INFO_FIELDS: ProfileField[] = [
  {
    label: 'ИМЯ',
    value: 'Иван'
  },
  {
    label: 'ФАМИЛИЯ',
    value: 'Иванов'
  },
  {
    label: 'EMAIL',
    value: 'ivan@gmail.com'
  },
  {
    label: 'ТЕЛЕФОН',
    value: '+7 (999) 123-45-67'
  }
]

export const PASSWORD_FIELDS: ProfileField[] = [
  {
    label: 'Новый пароль',
    value: '●●●●●●●●●●●●'
  },
  {
    label: 'Подтвердите пароль',
    value: '●●●●●●●●●●●●'
  }
]