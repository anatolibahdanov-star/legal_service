import { useEffect, useMemo, useState } from "react";
import { useGetList, useDelete, useNotify } from "react-admin";
import { Search, Pencil, Trash2, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { DBUser } from "@/src/interfaces/db";
import { formatRub, formatDate, statusMeta } from "./format";
import { UserModal } from "./UserModal";
import { DeleteDialog } from "./DeleteDialog";
import styles from "./users.module.css";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";
const perPage = 10;

type SortState = { field: string; order: "ASC" | "DESC" };

interface ColumnDef {
    key: string;
    label: string;
    sortable: boolean;
}

const columns: ColumnDef[] = [
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Имя", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "created_at", label: "Регистрация", sortable: true },
    { key: "status", label: "Статус", sortable: true },
    { key: "balance", label: "Баланс, ₽", sortable: true },
    { key: "paid_questions", label: "Платные вопросы", sortable: true },
];

const badgeClass = (tone: string) =>
    tone === "active" ? styles.badgeActive : tone === "blocked" ? styles.badgeBlocked : styles.badgeInactive;

export const UsersList = () => {
    const notify = useNotify();
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    const [sort, setSort] = useState<SortState>({ field: "id", order: "DESC" });
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState<{ id: string; tab: "general" | "operations" } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DBUser | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebounced(search.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const filter = useMemo(() => (debounced ? { q: debounced } : {}), [debounced]);

    const { data, total, isPending, refetch } = useGetList<DBUser>("users", {
        pagination: { page, perPage },
        sort: { field: sort.field, order: sort.order },
        filter,
    });

    const [deleteOne, { isPending: deleting }] = useDelete();

    const toggleSort = (field: string) => {
        setSort((prev) =>
            prev.field === field
                ? { field, order: prev.order === "ASC" ? "DESC" : "ASC" }
                : { field, order: "ASC" },
        );
        setPage(1);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteOne(
            "users",
            { id: deleteTarget.id, previousData: deleteTarget },
            {
                onSuccess: () => {
                    notify("Пользователь удалён", { type: "success" });
                    setDeleteTarget(null);
                    refetch();
                },
                onError: (error) => {
                    const message =
                        typeof error === "string"
                            ? error
                            : error instanceof Error && error.message
                              ? error.message
                              : "Не удалось удалить пользователя";
                    notify(message, { type: "error" });
                },
            },
        );
    };

    const rows = data ?? [];
    const totalCount = total ?? 0;
    const from = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, totalCount);
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Админ-панель</h1>
                    <p className={styles.subtitle}>Управление пользователями и балансами</p>
                </div>
                <div className={styles.searchWrap}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        placeholder="Поиск пользователя"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                {columns.map((col) => {
                                    const active = sort.field === col.key;
                                    return (
                                        <th
                                            key={col.key}
                                            className={col.sortable ? styles.sortable : undefined}
                                            onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                                        >
                                            <span className={styles.thInner}>
                                                {col.label}
                                                {col.sortable && (
                                                    <span className={active ? styles.sortIconActive : styles.sortIcon}>
                                                        {active ? (
                                                            sort.order === "ASC" ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                                        ) : (
                                                            <ChevronsUpDown size={14} />
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        </th>
                                    );
                                })}
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isPending && (
                                <tr><td className={styles.emptyRow} colSpan={8}>Загружаем пользователей...</td></tr>
                            )}
                            {!isPending && rows.length === 0 && (
                                <tr><td className={styles.emptyRow} colSpan={8}>Пользователи не найдены</td></tr>
                            )}
                            {!isPending && rows.map((user) => {
                                const meta = statusMeta(user.status);
                                const hasBalance = Number(user.balance_kop ?? user.balance ?? 0) > 0;
                                return (
                                    <tr key={user.id}>
                                        <td className={styles.idCell}>{user.id}</td>
                                        <td className={styles.nameCell}>{user.name}</td>
                                        <td>
                                            <a className={styles.emailLink} href={`mailto:${user.email}`}>{user.email}</a>
                                        </td>
                                        <td>{formatDate(user.created_at as unknown as string)}</td>
                                        <td>
                                            <span className={`${styles.badge} ${badgeClass(meta.tone)}`}>{meta.label}</span>
                                        </td>
                                        <td
                                            className={styles.balanceCell}
                                            onClick={() => setModal({ id: user.id.toString(), tab: "operations" })}
                                        >
                                            {formatRub(Number(user.balance ?? 0))}
                                        </td>
                                        <td>{Number(user.paid_questions ?? 0)}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.btnEdit}
                                                    onClick={() => setModal({ id: user.id.toString(), tab: "general" })}
                                                >
                                                    <Pencil size={14} />
                                                    EDIT
                                                </button>
                                                <span
                                                    className={styles.deleteWrap}
                                                    data-disabled={hasBalance || undefined}
                                                    title={hasBalance ? "Невозможно удалить пользователя с положительным балансом." : undefined}
                                                >
                                                    <button
                                                        className={styles.btnDelete}
                                                        onClick={() => setDeleteTarget(user)}
                                                        disabled={hasBalance}
                                                    >
                                                        <Trash2 size={14} />
                                                        DELETE
                                                    </button>
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalCount > perPage && (
                    <div className={styles.pager}>
                        <span>{from}–{to} из {totalCount}</span>
                        <div className={styles.pagerBtns}>
                            <button className={styles.pagerBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                Назад
                            </button>
                            <button
                                className={styles.pagerBtn}
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Вперёд
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {modal && (
                <UserModal
                    userId={modal.id}
                    apiBase={apiBase}
                    initialTab={modal.tab}
                    onClose={() => setModal(null)}
                    onChanged={() => refetch()}
                />
            )}

            <DeleteDialog
                open={!!deleteTarget}
                deleting={deleting}
                name={deleteTarget?.name ?? ""}
                email={deleteTarget?.email ?? ""}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

export default UsersList;
