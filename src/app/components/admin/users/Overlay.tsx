import { ReactNode, MouseEvent, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./users.module.css";

interface OverlayProps {
    onBackdrop?: () => void;
    children: ReactNode;
}

export const Overlay = ({ onBackdrop, children }: OverlayProps) => {
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    if (typeof document === "undefined") return null;

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onBackdrop?.();
    };

    return createPortal(
        <div className={styles.overlay} onMouseDown={handleMouseDown}>
            {children}
        </div>,
        document.body,
    );
};
