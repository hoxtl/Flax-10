import StandardModal from "./StandardModal/StandardModal";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({ title, message, onConfirm, onCancel, onAlternate, confirmText = "Confirm", cancelText = "Cancel", alternateText, isDanger = false }) {
    const btnClass = isDanger ? styles.dangerBtn : styles.primaryBtn;
    return (
        <StandardModal title={title} onClose={onCancel} backdropClassName={styles.backdrop}>
            <div className={styles.modalBody}>
                <div className={styles.message}>{message}</div>
                <div className={styles.buttons}>
                    <button className={styles.cancelBtn} onClick={onCancel}>{cancelText}</button>
                    {alternateText && <button className={styles.alternateBtn} onClick={onAlternate}>{alternateText}</button>}
                    <button className={btnClass} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </StandardModal>
    );
}
