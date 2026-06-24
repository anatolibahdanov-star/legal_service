import { X, Trash2 } from "lucide-react";
import { Overlay } from "./Overlay";
import styles from "./users.module.css";

interface DeleteDialogProps {
    open: boolean;
    deleting: boolean;
    name: string;
    email: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteDialog = ({ open, deleting, name, email, onClose, onConfirm }: DeleteDialogProps) => {
    if (!open) return null;

    return (
        <Overlay onBackdrop={() => { if (!deleting) onClose(); }}>
            <div className={`${styles.modal} ${styles.modalSmall}`} role="dialog" aria-modal="true">
                <button className={styles.closeBtn} onClick={onClose} disabled={deleting} aria-label="Закрыть">
                    <X size={20} />
                </button>
                <h3 className={styles.modalTitle}>Удалить пользователя?</h3>

                <p className={styles.dialogText}>
                    Пользователь <strong>{name}</strong> <span className={styles.dialogMuted}>({email})</span> будет удалён без
                    возможности восстановления.
                </p>

                <div className={styles.dialogFooter}>
                    <button className={styles.btnSecondary} onClick={onClose} disabled={deleting}>
                        Отмена
                    </button>
                    <button className={styles.btnDanger} onClick={onConfirm} disabled={deleting}>
                        <Trash2 size={16} />
                        {deleting ? "Удаляем..." : "Удалить"}
                    </button>
                </div>
            </div>
        </Overlay>
    );
};
