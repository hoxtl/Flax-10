/*
 * Confirm/cancel modal with optional danger styling, alternate action, and hint text.
 */

import StandardModal from "../standard_modal/StandardModal";
import PrimaryButton from "../primary_button/PrimaryButton";
import styles from "./ConfirmModal.module.css";

function DangerBadge({ dangerTitle, dangerDescription }) {
  return (
    <div className={styles.dangerBadge}>
      <span className={styles.dangerIcon} aria-hidden="true">!</span>
      <div className={styles.dangerText}>
        <span className={styles.dangerTitle}>{dangerTitle}</span>
        <span className={styles.dangerDescription}>{dangerDescription}</span>
      </div>
    </div>
  );
}

function ConfirmModalButtons({ isDanger, dangerHint, infoHint, centerText, onCancel, onAlternate, onConfirm, cancelText, alternateText, confirmText, confirmVariant }) {
  const buttonClasses = centerText ? `${styles.buttons} ${styles.buttonsCentered}` : styles.buttons;
  return (
    <>
      {isDanger && dangerHint && <div className={styles.dangerHint}>{dangerHint}</div>}
      {!isDanger && infoHint && <div className={styles.infoHint}>{infoHint}</div>}
      <div className={buttonClasses}>
        <PrimaryButton className={styles.cancelBtn} variant="ghost" pill onClick={onCancel}>{cancelText}</PrimaryButton>
        {alternateText && <PrimaryButton className={styles.alternateBtn} variant="secondary" pill onClick={onAlternate}>{alternateText}</PrimaryButton>}
        <PrimaryButton className={styles.confirmBtn} variant={confirmVariant} pill onClick={onConfirm}>{confirmText}</PrimaryButton>
      </div>
    </>
  );
}

/** Confirm/cancel modal with optional danger styling and alternate action. */

export default function ConfirmModal({ title, message, children, onConfirm, onCancel, onAlternate, confirmText = "Confirm", cancelText = "Cancel", alternateText, isDanger = false, centerText = false, dangerHint = "", infoHint = "", size = "sm", modalClassName = "", dangerTitle = "Session Progress Will Be Lost", dangerDescription = "Ending now will discard this session progress." }) {
  const confirmVariant = isDanger ? "danger" : "primary";
  const bodyClasses = `${styles.modalBody} ${isDanger ? styles.modalBodyDanger : ""}`.trim();
  const messageClasses = `${styles.message} ${isDanger ? styles.messageDanger : ""}`.trim();
  const modalClasses = `${styles.modal} ${isDanger ? styles.modalDanger : ""} ${modalClassName}`.trim();
  return (
    <StandardModal title={title} onClose={onCancel} centerText={centerText} size={size} modalClassName={modalClasses}>
      <div className={bodyClasses}>
        {isDanger && <DangerBadge dangerTitle={dangerTitle} dangerDescription={dangerDescription} />}
        {message && <div className={messageClasses}>{message}</div>}
        {children}
        <ConfirmModalButtons isDanger={isDanger} dangerHint={dangerHint} infoHint={infoHint} centerText={centerText} onCancel={onCancel} onAlternate={onAlternate} onConfirm={onConfirm} cancelText={cancelText} alternateText={alternateText} confirmText={confirmText} confirmVariant={confirmVariant} />
      </div>
    </StandardModal>
  );
}
