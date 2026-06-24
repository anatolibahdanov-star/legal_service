import { useState } from "react";
import { DBUser } from "@/src/interfaces/db";
import { formatRub, formatDate, statusOptions } from "./format";
import styles from "./users.module.css";

interface GeneralTabProps {
    user: DBUser;
    saving: boolean;
    onSave: (data: { name: string; email: string; status: number }) => Promise<boolean>;
}

export const GeneralTab = ({ user, saving, onSave }: GeneralTabProps) => {
    const [name, setName] = useState(user.name ?? "");
    const [email, setEmail] = useState(user.email ?? "");
    const [status, setStatus] = useState<number>(user.status ?? 1);

    const dirty = name !== (user.name ?? "") || email !== (user.email ?? "") || status !== (user.status ?? 1);

    const reset = () => {
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setStatus(user.status ?? 1);
    };

    const handleSave = async () => {
        if (!dirty) return;
        await onSave({ name: name.trim(), email: email.trim(), status });
    };

    return (
        <div>
            <div className={styles.fieldGrid}>
                <div className={styles.field}>
                    <p className={styles.fieldLabel}>ID</p>
                    <p className={styles.fieldValue}>#{user.id}</p>
                </div>

                <div className={`${styles.field} ${styles.fieldEditable}`}>
                    <p className={styles.fieldLabel}>Имя</p>
                    <input
                        className={styles.fieldInput}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className={`${styles.field} ${styles.fieldEditable}`}>
                    <p className={styles.fieldLabel}>Email</p>
                    <input
                        className={styles.fieldInput}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className={styles.field}>
                    <p className={styles.fieldLabel}>Дата регистрации</p>
                    <p className={styles.fieldValue}>{formatDate(user.created_at as unknown as string)}</p>
                </div>

                <div className={`${styles.field} ${styles.fieldEditable}`}>
                    <p className={styles.fieldLabel}>Статус</p>
                    <select
                        className={styles.fieldSelect}
                        value={status}
                        onChange={(e) => setStatus(Number(e.target.value))}
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.field}>
                    <p className={styles.fieldLabel}>Денежный баланс</p>
                    <p className={styles.fieldValue}>{formatRub(Number(user.balance ?? 0))}</p>
                </div>
            </div>

            {dirty && (
                <div className={styles.formFooter}>
                    <button className={styles.btnSecondary} onClick={reset} disabled={saving}>
                        Отмена
                    </button>
                    <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                        {saving ? "Сохраняем..." : "Сохранить"}
                    </button>
                </div>
            )}
        </div>
    );
};
