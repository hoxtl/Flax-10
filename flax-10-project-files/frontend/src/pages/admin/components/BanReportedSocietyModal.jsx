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

function BanForm({ busy, inputId, onClose, onReasonChange, onSubmit, reason }) {
  return (
    <form className={styles.banForm} onSubmit={onSubmit}>
      <div className={styles.banModalIconWrap} aria-hidden="true">
        <Ban size={20} strokeWidth={2.1} />
      </div>
      <label className={styles.reasonLabel} htmlFor={inputId}>
        Optional note to the society creator
      </label>
      <textarea id={inputId} className={styles.reasonInput} placeholder="Explain why this society is being banned. This note will be sent to the society creator." value={reason} onChange={onReasonChange} rows={3} autoFocus disabled={busy} />
      <div className={styles.modalActions}>
        <PrimaryButton className={styles.cancelActionBtn} variant="ghost" pill type="button" onClick={onClose} disabled={busy}>Cancel</PrimaryButton>
        <PrimaryButton className={styles.confirmActionBtn} variant="danger" pill type="submit" disabled={busy}>Ban Society</PrimaryButton>
      </div>
    </form>
  );
}

/** Modal for confirming a society ban with an optional reason note. */
export default function BanReportedSocietyModal({ busy = false, onCancel, onConfirm, report }) {
  const [reason, setReason] = useState("");
  const inputId = `ban-society-reason-${report?.id || "pending"}`;
  const handleClose = () => { if (busy) return; onCancel?.(); };
  const handleSubmit = (event) => { event.preventDefault(); onConfirm?.(reason.trim()); };
  return (
    <StandardModal title={getTitle(report)} subtitle="This society will be removed from the platform. Add an optional note if you want the creator to receive context." onClose={handleClose} size="sm" modalClassName={styles.banModal} contentClassName={styles.banModalContent} dismissOnBackdrop={!busy}>
      <BanForm busy={busy} inputId={inputId} onClose={handleClose} onReasonChange={(e) => setReason(e.target.value)} onSubmit={handleSubmit} reason={reason} />
    </StandardModal>
  );
}
