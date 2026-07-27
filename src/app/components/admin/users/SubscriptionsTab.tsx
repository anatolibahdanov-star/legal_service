import { useCallback, useEffect, useState } from "react";
import { DBUser } from "@/src/interfaces/db";
import { SubscriptionHistoryItemI, SubscriptionStatusE } from "@/src/interfaces/payment";
import { formatRub, formatDate, formatDateTime, subscriptionEventLabels, subscriptionStatusLabels } from "./format";
import styles from "./users.module.css";

interface SubscriptionsTabProps {
    user: DBUser;
    apiBase: string;
}

const periodLabel = (item: SubscriptionHistoryItemI): string => {
    if (!item.periodStart && !item.periodEnd) return "—";
    return `${formatDate(item.periodStart)} — ${formatDate(item.periodEnd)}`;
};

const bvLabel = (item: SubscriptionHistoryItemI): string => {
    const base = item.bvAmount === null || item.bvAmount === undefined ? "—" : String(item.bvAmount);
    if (item.bvDelta === null || item.bvDelta === undefined || item.bvDelta === 0) return base;
    const sign = item.bvDelta > 0 ? "+" : "−";
    return `${base} (${sign}${Math.abs(item.bvDelta)})`;
};

const statusLabel = (status: SubscriptionStatusE | null): string =>
    status === null || status === undefined ? "—" : (subscriptionStatusLabels[status] ?? "—");

export const SubscriptionsTab = ({ user, apiBase }: SubscriptionsTabProps) => {
    const [items, setItems] = useState<SubscriptionHistoryItemI[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const perPage = 5;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/subscriptions/history?user_id=${user.id}`, {
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
    }, [apiBase, user.id]);

    useEffect(() => {
        load();
    }, [load]);

    const totalCount = items.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    const safePage = Math.min(page, totalPages);
    const from = totalCount === 0 ? 0 : (safePage - 1) * perPage + 1;
    const to = Math.min(safePage * perPage, totalCount);
    const pageItems = items.slice((safePage - 1) * perPage, safePage * perPage);

    return (
        <div>
            <div className={styles.opsTableCard}>
                <div className={styles.opsTableScroll}>
                    <table className={styles.opsTable}>
                        <thead>
                            <tr>
                                <th>Дата и время</th>
                                <th>Тип операции</th>
                                <th>Тариф</th>
                                <th>Стоимость</th>
                                <th>Период действия</th>
                                <th>Количество запросов</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td className={styles.loadingRow} colSpan={7}>Загружается...</td></tr>
                            )}
                            {!loading && items.length === 0 && (
                                <tr><td className={styles.loadingRow} colSpan={7}>Подписок пока нет</td></tr>
                            )}
                            {!loading && pageItems.map((item) => (
                                <tr key={item.id}>
                                    <td>{formatDateTime(item.createdAt)}</td>
                                    <td>{subscriptionEventLabels[item.eventType] ?? "—"}</td>
                                    <td>{item.planName ?? "—"}</td>
                                    <td className={styles.opsAmount}>{item.priceRub === null || item.priceRub === undefined ? "—" : formatRub(item.priceRub)}</td>
                                    <td>{periodLabel(item)}</td>
                                    <td className={styles.opsAmount}>{bvLabel(item)}</td>
                                    <td>{statusLabel(item.statusAfter)}</td>
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
                            <button className={styles.pagerBtn} disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                Вперёд
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
