import { useState } from "react";
import { useGetOne, useUpdate, useNotify } from "react-admin";
import { X } from "lucide-react";
import { DBUser } from "@/src/interfaces/db";
import { GeneralTab } from "./GeneralTab";
import { OperationsTab } from "./OperationsTab";
import { SubscriptionsTab } from "./SubscriptionsTab";
import { Overlay } from "./Overlay";
import styles from "./users.module.css";

type UserModalTab = "general" | "operations" | "subscriptions";

interface UserModalProps {
    userId: string;
    apiBase: string;
    initialTab?: UserModalTab;
    onClose: () => void;
    onChanged: () => void;
}

export const UserModal = ({ userId, apiBase, initialTab = "general", onClose, onChanged }: UserModalProps) => {
    const [tab, setTab] = useState<UserModalTab>(initialTab);
    const notify = useNotify();
    const { data, isLoading, refetch } = useGetOne<DBUser>("users", { id: userId });
    const [update, { isPending: saving }] = useUpdate();

    const handleChanged = () => {
        refetch();
        onChanged();
    };

    const handleSave = async (values: { name: string; email: string; status: number }): Promise<boolean> => {
        if (!data) return false;
        return new Promise<boolean>((resolve) => {
            update(
                "users",
                { id: userId, data: { ...data, ...values }, previousData: data },
                {
                    onSuccess: () => {
                        notify("Изменения сохранены", { type: "success" });
                        handleChanged();
                        resolve(true);
                    },
                    onError: (error) => {
                        notify(typeof error === "string" ? error : "Не удалось сохранить изменения", { type: "error" });
                        resolve(false);
                    },
                },
            );
        });
    };

    return (
        <Overlay onBackdrop={onClose}>
            <div className={styles.modal} role="dialog" aria-modal="true">
                <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
                    <X size={22} />
                </button>

                <h2 className={styles.modalTitle}>
                    {data ? `Пользователь #${data.id} — ${data.name}` : "Пользователь"}
                </h2>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${tab === "general" ? styles.tabActive : ""}`}
                        onClick={() => setTab("general")}
                    >
                        Общая информация
                    </button>
                    <button
                        className={`${styles.tab} ${tab === "operations" ? styles.tabActive : ""}`}
                        onClick={() => setTab("operations")}
                    >
                        История операций
                    </button>
                    <button
                        className={`${styles.tab} ${tab === "subscriptions" ? styles.tabActive : ""}`}
                        onClick={() => setTab("subscriptions")}
                    >
                        История подписок
                    </button>
                </div>

                {isLoading || !data ? (
                    <p className={styles.loadingRow}>Загружается...</p>
                ) : tab === "general" ? (
                    <GeneralTab user={data} saving={saving} onSave={handleSave} />
                ) : tab === "operations" ? (
                    <OperationsTab user={data} apiBase={apiBase} onChanged={handleChanged} />
                ) : (
                    <SubscriptionsTab user={data} apiBase={apiBase} />
                )}
            </div>
        </Overlay>
    );
};
