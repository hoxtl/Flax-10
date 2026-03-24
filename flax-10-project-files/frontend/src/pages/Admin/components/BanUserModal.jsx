/*
 * Ban modal for admin user actions.
 */

import { useState } from "react";
import { Ban } from "lucide-react";
import StandardModal from "../../../components/common/StandardModal/StandardModal";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import styles from "../styles";

export default function BanUserModal({ onCancel, onConfirm, user }) {
  const [reason, setReason] = useState("");
  const trimmedReason = reason.trim();
  const inputId = `ban-reason-${user.id}`;

  function handleSubmit(event) {
    event.preventDefault();
    if (!trimmedReason) return;
    onConfirm(trimmedReason);
  }

  return (
    <StandardModal
      title={`Ban ${user.username}?`}
      subtitle="This user will be immediately locked out of their account."
      onClose={onCancel}
      size="sm"
      modalClassName={styles.banModal}
      contentClassName={styles.banModalContent}
    >
      <form className={styles.banForm} onSubmit={handleSubmit}>
        <div className={styles.banModalIconWrap} aria-hidden="true">
          <Ban size={20} strokeWidth={2.1} />
        </div>
        <label className={styles.reasonLabel} htmlFor={inputId}>
          Reason for ban <span className={styles.requiredMark} aria-hidden="true">*</span>
        </label>
        <textarea
          id={inputId}
          className={styles.reasonInput}
          placeholder="Explain why this user is being banned. This will be shown to the user."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          required
          autoFocus
        />
        <div className={styles.modalActions}>
          <PrimaryButton className={styles.cancelActionBtn} variant="ghost" pill onClick={onCancel}>Cancel</PrimaryButton>
          <PrimaryButton className={styles.confirmActionBtn} variant="danger" pill type="submit" disabled={!trimmedReason}>Ban User</PrimaryButton>
        </div>
      </form>
    </StandardModal>
  );
}
