export interface StatusColorI {
  name: string;
  color: string;
}

export enum QuestionStatusesE {
  Disabled = 0,
  New = 1,
  InProgress = 2,
  Spam = 3,
  Approved = 4,
}

export enum ReplyStatusesE {
  New = 0,
  Filled = 1,
  Auto = 2,
}

export enum FinalReplyStatusesE {
  New = 0,
  Filled = 1,
}

export enum EmailStatusesE {
  None = 0,
  Sent = 1,
  Error = 2,
}

export enum QuestionInfoStatusesE {
  None = 0,
  Sent = 1,
}

export enum UserRegisteredStatusesE {
  Registered = 1,
  NotRegistered = 0,
}

export enum UserStatusesE {
  Activated = 1,
  NotActivated = 0,
  Banned = 2,
}

export enum UserRolesE {
  Lawyer = 0,
  SuperAdmin = 1,
}

export enum LangItemsE {
  New = "Новый",
  Lawyer = "Юрист",
  None = "Нет",
  NotActivated = "Не активный",
  NotRegistered = "Не зарегестрирован",
  Disabled = "Не активирован",
  Sent = "Отправлено",
  Approved = "Подтверждено",
  Activated="Активировано",
  Registered="Зарегистрирован",
  SuperAdmin="Администратор",
  InProgress="В работе",
  Error="Ошибка",
  Banned="Заблокирован",
  Spam="СПАМ",
  Unknown="Не известно",
  Paid="Оплачен",
  Unpaid="Не оплачен",
  OneTime="Одноразовый",
  Balance="Пополнение баланса",
  Increase="Увеличение",
  Decrease="Уменьшение",
  Success="Успешно",
  Manual="Ручной",
  Auto="Автоматический",
}

export const statusesDesign: Record<number, StatusColorI> = {
    4: {color: "#10b981", name: "Ответ получен"},
    3: {color: "#ef4444", name: "СПАМ"},
    2: {color: "#3b82f6", name: "В работе"},
    1: {color: "#f59e0b", name: "В ожидании"},
    0: {color: "#ef4444", name: "Ошибка"},
  }

export const dFormat = 'dd.MM.yyyy в hh:ii'