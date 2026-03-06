import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDanger = false }) {
    const btnClass = isDanger ? styles.dangerBtn : styles.primaryBtn;
    return (
        <div className={styles.backdrop} onMouseDown={onCancel}>
            <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>{title}</h3>
                <div className={styles.message}>{message}</div>
                <div className={styles.buttons}>
                    <button className={styles.cancelBtn} onClick={onCancel}>{cancelText}</button>
                    <button className={btnClass} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}
