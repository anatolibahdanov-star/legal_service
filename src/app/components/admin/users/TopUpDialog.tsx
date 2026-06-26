import { useState } from "react";
import { X } from "lucide-react";
import { Overlay } from "./Overlay";
import styles from "./users.module.css";

interface TopUpDialogProps {
    open: boolean;
    submitting: boolean;
    onClose: () => void;
    onApply: (amount: number, comment: string) => Promise<{ ok: boolean; error?: string }>;
}

export const TopUpDialog = ({ open, submitting, onClose, onApply }: TopUpDialogProps) => {
    const [amount, setAmount] = useState("1000");
    const [comment, setComment] = useState("");
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const reset = () => {
        setAmount("1000");
        setComment("");
        setError(null);
    };

    const handleClose = () => {
        if (submitting) return;
        reset();
        onClose();
    };

    const handleApply = async () => {
        const numeric = Number(amount);
        if (!Number.isFinite(numeric) || numeric <= 0) {
            setError("Введите сумму больше нуля.");
            return;
        }
        if (comment.trim().length === 0) {
            setError("Комментарий обязателен.");
            return;
        }
        setError(null);
        const res = await onApply(numeric, comment.trim());
        if (res.ok) {
            reset();
        } else {
            setError(res.error ?? "Не удалось изменить баланс.");
        }
    };

    return (
        <Overlay onBackdrop={handleClose}>
            <div className={`${styles.modal} ${styles.modalSmall}`} role="dialog" aria-modal="true">
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Закрыть">
                    <X size={20} />
                </button>
                <h3 className={styles.modalTitle}>Пополнить баланс</h3>

                <div className={styles.dialogField}>
                    <label className={styles.dialogLabel}>Сумма, ₽</label>
                    <input
                        type="number"
                        className={styles.dialogInput}
                        value={amount}
                        min={0}
                        step={1}
                        onChange={(e) => setAmount(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className={styles.dialogField}>
                    <label className={styles.dialogLabel}>
                        Комментарий <span className={styles.required}>*</span>
                    </label>
                    <textarea
                        className={styles.dialogTextarea}
                        value={comment}
                        placeholder="Основание для изменения (обязательно)"
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                {error && <p className={styles.dialogError}>{error}</p>}

                <div className={styles.dialogFooter}>
                    <button className={styles.btnSecondary} onClick={handleClose} disabled={submitting}>
                        Отмена
                    </button>
                    <button className={styles.btnPrimary} onClick={handleApply} disabled={submitting}>
                        {submitting ? "Применяем..." : "Применить"}
                    </button>
                </div>
            </div>
        </Overlay>
    );
};
