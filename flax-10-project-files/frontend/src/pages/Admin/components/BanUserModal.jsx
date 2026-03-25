/*
 * Ban modal for admin user actions.
 */

import { useState } from "react";
import { Ban } from "lucide-react";
import StandardModal from "../../../components/common/StandardModal/StandardModal";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import styles from "../styles";

export default function BanUserModal(props) {
  const form = useBanReasonForm(props);
  return (
    <StandardModal
      title={`Ban ${props.user.username}?`}
      subtitle="This user will be immediately locked out of their account."
      onClose={props.onCancel}
      size="sm"
      modalClassName={styles.banModal}
      contentClassName={styles.banModalContent}
    >
      <BanReasonForm {...form} onCancel={props.onCancel} />
    </StandardModal>
  );
}

function useBanReasonForm({ onConfirm, user }) {
  const [reason, setReason] = useState("");
  const trimmedReason = reason.trim();
  const inputId = `ban-reason-${user.id}`;
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!trimmedReason) return;
    onConfirm(trimmedReason);
  };
  return { handleChange: (event) => setReason(event.target.value), handleSubmit, inputId, reason, trimmedReason };
}

function BanReasonForm({ handleChange, handleSubmit, inputId, onCancel, reason, trimmedReason }) {
  return (
    <form className={styles.banForm} onSubmit={handleSubmit}>
      <BanModalIcon />
      <BanReasonLabel inputId={inputId} />
      <BanReasonTextarea inputId={inputId} onChange={handleChange} value={reason} />
      <BanModalActions disabled={!trimmedReason} onCancel={onCancel} />
    </form>
  );
}

function BanModalIcon() {
  return (
    <div className={styles.banModalIconWrap} aria-hidden="true">
      <Ban size={20} strokeWidth={2.1} />
    </div>
  );
}

function BanReasonLabel({ inputId }) {
  return (
    <label className={styles.reasonLabel} htmlFor={inputId}>
      Reason for ban <span className={styles.requiredMark} aria-hidden="true">*</span>
    </label>
  );
}

function BanReasonTextarea({ inputId, onChange, value }) {
  return (
    <textarea
      id={inputId}
      className={styles.reasonInput}
      placeholder="Explain why this user is being banned. This will be shown to the user."
      value={value}
      onChange={onChange}
      rows={3}
      required
      autoFocus
    />
  );
}

function BanModalActions({ disabled, onCancel }) {
  return (
    <div className={styles.modalActions}>
      <PrimaryButton className={styles.cancelActionBtn} variant="ghost" pill onClick={onCancel}>Cancel</PrimaryButton>
      <PrimaryButton className={styles.confirmActionBtn} variant="danger" pill type="submit" disabled={disabled}>Ban User</PrimaryButton>
    </div>
  );
}
