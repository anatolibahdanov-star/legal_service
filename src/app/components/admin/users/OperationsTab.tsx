import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Plus, Gift } from "lucide-react";
import { DBUser } from "@/src/interfaces/db";
import { AdminBalanceOperationI } from "@/src/interfaces/payment";
import { formatRub, formatDateTime, operationTypeLabels, formatOperationValue } from "./format";
import { TopUpDialog } from "./TopUpDialog";
import { FreeQuestionsDialog } from "./FreeQuestionsDialog";
import styles from "./users.module.css";

interface OperationsTabProps {
    user: DBUser;
    apiBase: string;
    onChanged: () => void;
}

const typeFilterOptions = [
    { value: "all", label: "Все операции" },
    { value: "payment", label: "Оплата" },
    { value: "charge", label: "Списание с баланса" },
    { value: "refund", label: "Возврат" },
    { value: "manual", label: "Ручное изменение" },
    { value: "free", label: "Бесплатные вопросы" },
];

const questionHref = (questionId: number): string => {
    const base = (process.env.NEXT_PUBLIC_URL ?? "").replace(/\/$/, "");
    return `${base}/admin#/requests/${questionId}/show`;
};

export const OperationsTab = ({ user, apiBase, onChanged }: OperationsTabProps) => {
    const [items, setItems] = useState<AdminBalanceOperationI[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [freeDialogOpen, setFreeDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const perPage = 5;

    const loadOperations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/operations?user_id=${user.id}&type=${type}`, {
                credentials: "include",
            });
            const data = await res.json();
            setItems(res.ok ? (data.items ?? []) : []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
            setPage(1);
        }
    }, [apiBase, user.id, type]);

    useEffect(() => {
        loadOperations();
    }, [loadOperations]);

    const handleApply = async (amount: number, comment: string) => {
        setSubmitting(true);
        try {
            const res = await fetch(`${apiBase}/operations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ user_id: user.id, amount, comment }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                return { ok: false, error: data?.message ?? "Не удалось изменить баланс." };
            }
            setDialogOpen(false);
            await loadOperations();
            onChanged();
            return { ok: true };
        } catch {
            return { ok: false, error: "Сетевая ошибка. Попробуйте ещё раз." };
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccrueFree = async (count: number, comment: string) => {
        setSubmitting(true);
        try {
            const res = await fetch(`${apiBase}/operations/free-questions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ user_id: user.id, count, comment }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                return { ok: false, error: data?.message ?? "Не удалось начислить бесплатные вопросы." };
            }
            setFreeDialogOpen(false);
            await loadOperations();
            onChanged();
            return { ok: true };
        } catch {
            return { ok: false, error: "Сетевая ошибка. Попробуйте ещё раз." };
        } finally {
            setSubmitting(false);
        }
    };

    const renderComment = (op: AdminBalanceOperationI) => {
        if (op.questionId) {
            return (
                <a className={styles.opsLink} href={questionHref(op.questionId)} target="_blank" rel="noopener noreferrer">
                    Вопрос №{op.questionId}
                </a>
            );
        }
        if (op.comment) {
            return <span className={styles.opsComment}>{op.comment}</span>;
        }
        return <span className={styles.opsMuted}>—</span>;
    };

    const totalCount = items.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    const safePage = Math.min(page, totalPages);
    const from = totalCount === 0 ? 0 : (safePage - 1) * perPage + 1;
    const to = Math.min(safePage * perPage, totalCount);
    const pageItems = items.slice((safePage - 1) * perPage, safePage * perPage);

    return (
        <div>
            <div className={styles.balanceBlocks}>
                <div className={styles.balanceBlock}>
                    <p className={styles.balanceBlockLabel}>Денежный баланс</p>
                    <p className={styles.balanceBlockValue}>{formatRub(Number(user.balance ?? 0))}</p>
                </div>
                <div className={styles.balanceBlock}>
                    <p className={styles.balanceBlockLabel}>Платные вопросы</p>
                    <p className={styles.balanceBlockValue}>{Number(user.paid_questions ?? 0)}</p>
                </div>
                <div className={styles.balanceBlock}>
                    <p className={styles.balanceBlockLabel}>Бесплатные вопросы</p>
                    <p className={styles.balanceBlockValue}>{Number(user.free_questions ?? 0)}</p>
                </div>
            </div>

            <div className={styles.opsToolbar}>
                <div className={styles.selectWrap}>
                    <select className={styles.opsSelect} value={type} onChange={(e) => setType(e.target.value)}>
                        {typeFilterOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown size={18} className={styles.selectChevron} />
                </div>
                <div className={styles.opsToolbarActions}>
                    <button className={styles.btnSecondary} onClick={() => setFreeDialogOpen(true)}>
                        <Gift size={18} />
                        Начислить бесплатные вопросы
                    </button>
                    <button className={styles.btnPrimary} onClick={() => setDialogOpen(true)}>
                        <Plus size={18} />
                        Пополнить баланс
                    </button>
                </div>
            </div>

            <div className={styles.opsTableCard}>
                <div className={styles.opsTableScroll}>
                    <table className={styles.opsTable}>
                        <thead>
                            <tr>
                                <th>Дата и время</th>
                                <th>Тип операции</th>
                                <th>Сумма / кол-во</th>
                                <th>Комментарий</th>
                                <th>Кто изменил</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td className={styles.loadingRow} colSpan={5}>Загружается...</td></tr>
                            )}
                            {!loading && items.length === 0 && (
                                <tr><td className={styles.loadingRow} colSpan={5}>Операций пока нет</td></tr>
                            )}
                            {!loading && pageItems.map((op) => (
                                <tr key={op.id}>
                                    <td>{formatDateTime(op.createdAt)}</td>
                                    <td>{operationTypeLabels[op.type]}</td>
                                    <td className={styles.opsAmount}>{formatOperationValue(op)}</td>
                                    <td>{renderComment(op)}</td>
                                    <td>{op.actor}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalCount > perPage && (
                    <div className={styles.pager}>
                        <span>{from}–{to} из {totalCount}</span>
                        <div className={styles.pagerBtns}>
                            <button className={styles.pagerBtn} disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                                Назад
                            </button>
                            <button
                                className={styles.pagerBtn}
                                disabled={safePage >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Вперёд
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <TopUpDialog
                open={dialogOpen}
                submitting={submitting}
                onClose={() => setDialogOpen(false)}
                onApply={handleApply}
            />

            <FreeQuestionsDialog
                open={freeDialogOpen}
                submitting={submitting}
                onClose={() => setFreeDialogOpen(false)}
                onApply={handleAccrueFree}
            />
        </div>
    );
};
