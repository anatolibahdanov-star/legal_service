import { format } from "date-fns";
import {
    AdminBalanceOperationI,
    AdminOperationTypeE,
} from "@/src/interfaces/payment";
import { UserStatusesE } from "@/src/interfaces/data";

const freeQuestionTypes: AdminOperationTypeE[] = [
    AdminOperationTypeE.FreeAccrual,
    AdminOperationTypeE.FreeCharge,
];

export const isFreeQuestionOperation = (type: AdminOperationTypeE): boolean =>
    freeQuestionTypes.includes(type);

export const pluralizeQuestions = (n: number): string => {
    const abs = Math.abs(n) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return "вопросов";
    if (last === 1) return "вопрос";
    if (last >= 2 && last <= 4) return "вопроса";
    return "вопросов";
};

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
    [AdminOperationTypeE.FreeAccrual]: "Начисление бесплатных вопросов",
    [AdminOperationTypeE.FreeCharge]: "Списание бесплатных вопросов",
};

/**
 * Значение в столбце «Сумма»: деньги — в рублях, операции с бесплатными
 * вопросами — в штуках со знаком (+ начисление, − списание).
 */
export const formatOperationValue = (op: AdminBalanceOperationI): string => {
    const abs = Math.abs(op.amount);
    if (isFreeQuestionOperation(op.type)) {
        const sign = op.type === AdminOperationTypeE.FreeCharge ? "−" : "+";
        return `${sign}${abs} ${pluralizeQuestions(abs)}`;
    }
    return `${formatAmount(abs)} ₽`;
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
