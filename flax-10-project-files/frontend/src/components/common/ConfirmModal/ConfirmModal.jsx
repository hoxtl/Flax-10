import StandardModal from "../StandardModal/StandardModal";
import PrimaryButton from "../PrimaryButton/PrimaryButton";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({ title, message, onConfirm, onCancel, onAlternate, confirmText = "Confirm", cancelText = "Cancel", alternateText, isDanger = false }) {
    const confirmVariant = isDanger ? "danger" : "primary";
    return (
        <StandardModal title={title} onClose={onCancel}>
            <div className={styles.modalBody}>
                <div className={styles.message}>{message}</div>
                <div className={styles.buttons}>
                    <PrimaryButton className={styles.cancelBtn} variant="ghost" pill onClick={onCancel}>{cancelText}</PrimaryButton>
                    {alternateText && <PrimaryButton className={styles.alternateBtn} variant="secondary" pill onClick={onAlternate}>{alternateText}</PrimaryButton>}
                    <PrimaryButton className={styles.confirmBtn} variant={confirmVariant} pill onClick={onConfirm}>{confirmText}</PrimaryButton>
                </div>
            </div>
        </StandardModal>
    );
}
