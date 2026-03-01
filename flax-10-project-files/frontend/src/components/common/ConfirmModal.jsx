import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel" }) {
    return (
        <div className={styles.backdrop} onMouseDown={onCancel}>
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>
                <div className={styles.buttons}>
                    <button className={styles.cancelBtn} onClick={onCancel}>{cancelText}</button>
                    <button className={styles.confirmBtn} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}
