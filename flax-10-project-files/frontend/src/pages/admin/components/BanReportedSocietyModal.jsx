/*
 * Ban modal for reported society admin actions.
 */

import { useState } from "react";
import { Ban } from "lucide-react";
import StandardModal from "../../../components/common/standard_modal/StandardModal";
import PrimaryButton from "../../../components/common/primary_button/PrimaryButton";
import styles from "../styles/styles";

function getTitle(report) {
  return `Ban ${report?.society_name || "this society"}?`;
}

export default function BanReportedSocietyModal({ busy = false, onCancel, onConfirm, report }) {
  const [reason, setReason] = useState("");
  const inputId = `ban-society-reason-${report?.id || "pending"}`;
  const handleClose = () => {
    if (busy) return;
    onCancel?.();
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    onConfirm?.(reason.trim());
  };

  return (
    <StandardModal
      title={getTitle(report)}
      subtitle="This society will be removed from the platform. Add an optional note if you want the creator to receive context."
      onClose={handleClose}
      size="sm"
      modalClassName={styles.banModal}
      contentClassName={styles.banModalContent}
      dismissOnBackdrop={!busy}
    >
      <form className={styles.banForm} onSubmit={handleSubmit}>
        <div className={styles.banModalIconWrap} aria-hidden="true">
          <Ban size={20} strokeWidth={2.1} />
        </div>
        <label className={styles.reasonLabel} htmlFor={inputId}>
          Optional note to the society creator
        </label>
        <textarea
          id={inputId}
          className={styles.reasonInput}
          placeholder="Explain why this society is being banned. This note will be sent to the society creator."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          autoFocus
          disabled={busy}
        />
        <div className={styles.modalActions}>
          <PrimaryButton className={styles.cancelActionBtn} variant="ghost" pill type="button" onClick={handleClose} disabled={busy}>
            Cancel
          </PrimaryButton>
          <PrimaryButton className={styles.confirmActionBtn} variant="danger" pill type="submit" disabled={busy}>
            Ban Society
          </PrimaryButton>
        </div>
      </form>
    </StandardModal>
  );
}
