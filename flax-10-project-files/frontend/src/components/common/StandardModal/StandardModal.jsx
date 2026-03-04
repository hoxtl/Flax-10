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

export default function StandardModal({ title, subtitle, onClose, children }) {
    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                {title && <ModalHeader title={title} subtitle={subtitle} onClose={onClose} />}
                {children}
            </div>
        </div>
    );
}
