import { X } from "lucide-react";
import { createPortal } from "react-dom";
import styles from "./StandardModal.module.css";

export function ModalHeader({ title, subtitle, onClose, centerText }) {
    const headerClasses = centerText ? `${styles.header} ${styles.headerCentered}` : styles.header;
    return (
        <div className={headerClasses}>
            <div>
                <h2 className={styles.title}>{title}</h2>
                {subtitle && <p className={styles.sub}>{subtitle}</p>}
            </div>
            <button className={styles.close} onClick={onClose} type="button" aria-label="Close">
                <X size={16} strokeWidth={2.2} />
            </button>
        </div>
    );
}

export default function StandardModal({
    title,
    subtitle,
    onClose,
    children,
    size = "md",
    backdropClassName = "",
    modalClassName = "",
    contentClassName = "",
    hideHeader = false,
    backdropRef = null,
    centerText = false,
}) {
    const backdropClasses = backdropClassName ? `${styles.backdrop} ${backdropClassName}` : styles.backdrop;
    const sizeClass = styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}`] || "";
    const modalClasses = [styles.modal, sizeClass, modalClassName].filter(Boolean).join(" ");
    const contentClasses = [
        styles.content,
        centerText && styles.contentCentered,
        contentClassName
    ].filter(Boolean).join(" ");

    return createPortal(
        <div className={backdropClasses} onMouseDown={onClose} ref={backdropRef}>
            <div className={modalClasses} onMouseDown={e => e.stopPropagation()}>
                {!hideHeader && title && (
                    <ModalHeader
                        title={title}
                        subtitle={subtitle}
                        onClose={onClose}
                        centerText={centerText}
                    />
                )}
                <div className={contentClasses}>{children}</div>
            </div>
        </div>,
        document.body
    );
}
