/*
 * Confirm/cancel modal with optional danger styling, alternate action, and hint text.
 */

import StandardModal from "../StandardModal/StandardModal";
import PrimaryButton from "../PrimaryButton/PrimaryButton";
import styles from "./ConfirmModal.module.css";

function buildClasses(isDanger, centerText, modalClassName) {
  return {
    body: `${styles.modalBody} ${isDanger ? styles.modalBodyDanger : ''}`.trim(),
    message: `${styles.message} ${isDanger ? styles.messageDanger : ''}`.trim(),
    modal: `${styles.modal} ${isDanger ? styles.modalDanger : ''} ${modalClassName}`.trim(),
    buttons: centerText ? `${styles.buttons} ${styles.buttonsCentered}` : styles.buttons,
  };
}

function DangerBadge() {
  return (
    <div className={styles.dangerBadge}>
      <span aria-hidden="true">⚠️</span>
      <span>Ending now will discard this session progress.</span>
    </div>
  );
}

function ModalButtons({ cancelText, onCancel, alternateText, onAlternate, confirmText, onConfirm, isDanger, cls }) {
  return (
    <div className={cls.buttons}>
      <PrimaryButton className={styles.cancelBtn} variant="ghost" pill onClick={onCancel}>{cancelText}</PrimaryButton>
      {alternateText && <PrimaryButton className={styles.alternateBtn} variant="secondary" pill onClick={onAlternate}>{alternateText}</PrimaryButton>}
      <PrimaryButton className={styles.confirmBtn} variant={isDanger ? "danger" : "primary"} pill onClick={onConfirm}>{confirmText}</PrimaryButton>
    </div>
  );
}

function ModalBody({ isDanger, message, children, dangerHint, infoHint, cls, ...buttonProps }) {
  return (
    <div className={cls.body}>
      {isDanger && <DangerBadge />}
      {message && <div className={cls.message}>{message}</div>}
      {children}
      {isDanger && dangerHint && <div className={styles.dangerHint}>{dangerHint}</div>}
      {!isDanger && infoHint && <div className={styles.infoHint}>{infoHint}</div>}
      <ModalButtons cls={cls} {...buttonProps} isDanger={isDanger} />
    </div>
  );
}

/** Confirmation modal with primary and cancel actions, and optional danger variant. */
export default function ConfirmModal({
  title, message, children, onConfirm, onCancel, onAlternate,
  confirmText = "Confirm", cancelText = "Cancel", alternateText,
  isDanger = false, centerText = false, dangerHint = "", infoHint = "",
  size = "sm", modalClassName = "",
}) {
  const cls = buildClasses(isDanger, centerText, modalClassName);
  return (
    <StandardModal title={title} onClose={onCancel} centerText={centerText} size={size} modalClassName={cls.modal}>
      <ModalBody isDanger={isDanger} message={message} dangerHint={dangerHint} infoHint={infoHint}
        cancelText={cancelText} onCancel={onCancel} alternateText={alternateText} onAlternate={onAlternate}
        confirmText={confirmText} onConfirm={onConfirm} cls={cls}>{children}</ModalBody>
    </StandardModal>
  );
}
