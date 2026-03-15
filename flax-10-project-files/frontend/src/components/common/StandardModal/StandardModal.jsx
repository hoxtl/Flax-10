import styles from "./StandardModal.module.css";

export function ModalHeader({ title, subtitle, onClose }) {
    return (
        <div className={styles.header}>
            <div>
                <h2 className={styles.title}>{title}</h2>
                {subtitle && <p className={styles.sub}>{subtitle}</p>}
            </div>
            <button className={styles.close} onClick={onClose} type="button">&times;</button>
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
}) {
    const backdropClasses = backdropClassName ? `${styles.backdrop} ${backdropClassName}` : styles.backdrop;
    const sizeClass = styles[`size${size.charAt(0).toUpperCase()}${size.slice(1)}`] || "";
    const modalClasses = [styles.modal, sizeClass, modalClassName].filter(Boolean).join(" ");
    const contentClasses = contentClassName ? `${styles.content} ${contentClassName}` : styles.content;

    return (
        <div className={backdropClasses} onMouseDown={onClose}>
            <div className={modalClasses} onMouseDown={e => e.stopPropagation()}>
                {!hideHeader && title && <ModalHeader title={title} subtitle={subtitle} onClose={onClose} />}
                <div className={contentClasses}>{children}</div>
            </div>
        </div>
    );
}
