import { format } from "date-fns";
import {
    AdminOperationTypeE,
} from "@/src/interfaces/payment";
import { UserStatusesE } from "@/src/interfaces/data";

const rubFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export const formatRub = (amount: number): string => `${rubFormatter.format(amount ?? 0)} ₽`;
export const formatAmount = (amount: number): string => rubFormatter.format(amount ?? 0);

export const formatDate = (value: string | number | Date | null | undefined): string => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, "dd.MM.yyyy");
};

export const formatDateTime = (value: string | number | Date | null | undefined): string => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, "dd.MM.yyyy в HH:mm");
};

export const operationTypeLabels: Record<AdminOperationTypeE, string> = {
    [AdminOperationTypeE.Payment]: "Оплата",
    [AdminOperationTypeE.Charge]: "Списание с баланса",
    [AdminOperationTypeE.Refund]: "Возврат",
    [AdminOperationTypeE.Manual]: "Ручное изменение",
};

export interface StatusMeta {
    label: string;
    tone: "active" | "blocked" | "inactive";
}

export const statusMeta = (status: number | undefined): StatusMeta => {
    switch (status) {
        case UserStatusesE.Activated:
            return { label: "Активен", tone: "active" };
        case UserStatusesE.Banned:
            return { label: "Заблокирован", tone: "blocked" };
        default:
            return { label: "Не активирован", tone: "inactive" };
    }
};

export const statusOptions = [
    { value: UserStatusesE.Activated, label: "Активен" },
    { value: UserStatusesE.NotActivated, label: "Не активирован" },
    { value: UserStatusesE.Banned, label: "Заблокирован" },
];
