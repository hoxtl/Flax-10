import StandardModal from "../StandardModal/StandardModal";
import PrimaryButton from "../PrimaryButton/PrimaryButton";
import styles from "./ConfirmModal.module.css";

export default function ConfirmModal({ title, message, children, onConfirm, onCancel, onAlternate, confirmText = "Confirm", cancelText = "Cancel", alternateText, isDanger = false, centerText = false, dangerHint = "", infoHint = "", size = "sm", modalClassName = "" }) {
    const confirmVariant = isDanger ? "danger" : "primary";
    const buttonClasses = centerText ? `${styles.buttons} ${styles.buttonsCentered}` : styles.buttons;
    const bodyClasses = `${styles.modalBody} ${isDanger ? styles.modalBodyDanger : ''}`.trim();
    const messageClasses = `${styles.message} ${isDanger ? styles.messageDanger : ''}`.trim();
    const modalClasses = `${styles.modal} ${isDanger ? styles.modalDanger : ''} ${modalClassName}`.trim();

    return (
        <StandardModal title={title} onClose={onCancel} centerText={centerText} size={size} modalClassName={modalClasses}>
            <div className={bodyClasses}>
                {isDanger && (
                    <div className={styles.dangerBadge}>
                        <span aria-hidden="true">⚠️</span>
                        <span>Ending now will discard this session progress.</span>
                    </div>
                )}
                {message && <div className={messageClasses}>{message}</div>}
                {children}
                {isDanger && dangerHint && <div className={styles.dangerHint}>{dangerHint}</div>}
                {!isDanger && infoHint && <div className={styles.infoHint}>{infoHint}</div>}
                <div className={buttonClasses}>
                    <PrimaryButton className={styles.cancelBtn} variant="ghost" pill onClick={onCancel}>{cancelText}</PrimaryButton>
                    {alternateText && <PrimaryButton className={styles.alternateBtn} variant="secondary" pill onClick={onAlternate}>{alternateText}</PrimaryButton>}
                    <PrimaryButton className={styles.confirmBtn} variant={confirmVariant} pill onClick={onConfirm}>{confirmText}</PrimaryButton>
                </div>
            </div>
        </StandardModal>
    );
}
