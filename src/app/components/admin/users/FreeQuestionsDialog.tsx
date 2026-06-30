import { useState } from "react";
import { X } from "lucide-react";
import { Overlay } from "./Overlay";
import styles from "./users.module.css";

interface FreeQuestionsDialogProps {
    open: boolean;
    submitting: boolean;
    onClose: () => void;
    onApply: (count: number, comment: string) => Promise<{ ok: boolean; error?: string }>;
}

export const FreeQuestionsDialog = ({ open, submitting, onClose, onApply }: FreeQuestionsDialogProps) => {
    const [count, setCount] = useState("1");
    const [comment, setComment] = useState("");
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const reset = () => {
        setCount("1");
        setComment("");
        setError(null);
    };

    const handleClose = () => {
        if (submitting) return;
        reset();
        onClose();
    };

    const handleApply = async () => {
        const numeric = Number(count);
        if (!Number.isInteger(numeric) || numeric <= 0) {
            setError("Введите целое количество больше нуля.");
            return;
        }
        setError(null);
        const res = await onApply(numeric, comment.trim());
        if (res.ok) {
            reset();
        } else {
            setError(res.error ?? "Не удалось начислить бесплатные вопросы.");
        }
    };

    return (
        <Overlay onBackdrop={handleClose}>
            <div className={`${styles.modal} ${styles.modalSmall}`} role="dialog" aria-modal="true">
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Закрыть">
                    <X size={20} />
                </button>
                <h3 className={styles.modalTitle}>Начислить бесплатные вопросы</h3>

                <div className={styles.dialogField}>
                    <label className={styles.dialogLabel}>
                        Количество вопросов <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="number"
                        className={styles.dialogInput}
                        value={count}
                        min={1}
                        step={1}
                        onChange={(e) => setCount(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className={styles.dialogField}>
                    <label className={styles.dialogLabel}>Комментарий</label>
                    <textarea
                        className={styles.dialogTextarea}
                        value={comment}
                        placeholder="Основание для начисления (необязательно)"
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                {error && <p className={styles.dialogError}>{error}</p>}

                <div className={styles.dialogFooter}>
                    <button className={styles.btnSecondary} onClick={handleClose} disabled={submitting}>
                        Отмена
                    </button>
                    <button className={styles.btnPrimary} onClick={handleApply} disabled={submitting}>
                        {submitting ? "Начисляем..." : "Начислить"}
                    </button>
                </div>
            </div>
        </Overlay>
    );
};
