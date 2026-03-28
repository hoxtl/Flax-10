/*
 * Modal for reporting a society for review.
 */

import { useState } from "react";
import StandardModal from "../../common/standard_modal/StandardModal";
import PrimaryButton from "../../common/primary_button/PrimaryButton";
import styles from "./ReportSocietyModal.module.css";
import { reportSociety } from "../../../api/societyApi";

const INITIAL_STATE = { submitting: false, error: "", submitted: false };

function FormContent({ reason, onTextChange, error, submitting }) {
  return (
    <div className={styles.container}>
      <textarea
        className={styles.textarea}
        placeholder="Reason..."
        value={reason}
        onChange={onTextChange}
        rows={4}
        disabled={submitting}
      />
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

function makeOnSubmit(reason, setState, societyId, onReportSuccess) {
  return async () => {
    setState({ submitting: true, error: "", submitted: false });
    try {
      await reportSociety(societyId, reason.trim());
    } catch {
      return setState({ submitting: false, error: "Failed to submit report.", submitted: false });
    }

    onReportSuccess?.();
    setState({ submitting: false, error: "", submitted: true });
  };
}

function useReportSocietyModel(societyId, onReportSuccess) {
  const [reason, setReason] = useState("");
  const [state, setState] = useState(INITIAL_STATE);
  return {
    ...state,
    reason,
    setReason,
    onSubmit: makeOnSubmit(reason, setState, societyId, onReportSuccess),
  };
}

function ReportSuccessModal({ societyName, onClose }) {
  return (
    <StandardModal
      title="Report submitted"
      subtitle={`Thanks for flagging ${societyName}. Our team will review it shortly.`}
      onClose={onClose}
      size="sm"
      centerText
    >
      <div className={styles.successBody}>
        <div className={styles.successBadge} aria-hidden="true">✓</div>
        <p className={styles.successText}>You can still unreport this society later if you submitted this by mistake.</p>
        <div className={styles.actions}>
          <PrimaryButton className={styles.confirmButton} onClick={onClose} pill>Done</PrimaryButton>
        </div>
      </div>
    </StandardModal>
  );
}

function buildReportFormModalProps(societyName, onClose) {
  return {
    title: `Report "${societyName}"`,
    onClose,
    subtitle: "Please let us know why you are reporting this society.",
  };
}

function ReportFormBody({ model, onClose }) {
  return (
    <>
      <FormContent reason={model.reason} onTextChange={(event) => model.setReason(event.target.value)} error={model.error} submitting={model.submitting} />
      <ReportActions onClose={onClose} onSubmit={model.onSubmit} submitting={model.submitting} disabled={!model.reason.trim()} />
    </>
  );
}

function ReportFormModal({ societyName, onClose, model }) {
  return <StandardModal {...buildReportFormModalProps(societyName, onClose)}><ReportFormBody model={model} onClose={onClose} /></StandardModal>;
}

function ReportActions({ onClose, onSubmit, submitting, disabled }) {
  return (
    <div className={styles.actions}>
      <PrimaryButton className={styles.cancelButton} variant="ghost" onClick={onClose} disabled={submitting} pill>Cancel</PrimaryButton>
      <PrimaryButton className={styles.submitButton} variant="danger" onClick={onSubmit} disabled={submitting || disabled} pill>
        {submitting ? "Submitting..." : "Submit Report"}
      </PrimaryButton>
    </div>
  );
}

/** Modal that lets a user report a society. */

export default function ReportSocietyModal({ society, onClose, onReportSuccess }) {
  const model = useReportSocietyModel(society.id, onReportSuccess);
  if (model.submitted) return <ReportSuccessModal societyName={society.name} onClose={onClose} />;
  return <ReportFormModal societyName={society.name} onClose={onClose} model={model} />;
}
