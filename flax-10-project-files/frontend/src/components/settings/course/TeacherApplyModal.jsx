/*
 * Modal for teacher-role applications.
 */
import { useState } from "react";
import { requestTeacherRole } from "../../../api/adminApi";
import styles from "../../../pages/Settings/Settings.module.css";
import InlineAlert from "../../common/InlineAlert/InlineAlert";
import PrimaryButton from "../../common/PrimaryButton/PrimaryButton";
import StandardModal from "../../common/StandardModal/StandardModal";

function useTeacherApplicationForm() {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  return { reason, setReason, submitting, setSubmitting, error, setError };
}

function ReasonField({ reason, setReason }) {
  return (
    <div className={styles.formGroup}>
      <label>
        Why should you be a teacher?
        <span aria-hidden="true"> *</span>
      </label>
      <textarea className={styles.modalTextarea} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell us about your teaching experience, expertise, or why you'd like to create modules..." rows={4} required aria-required="true" />
    </div>
  );
}

function TeacherWarning() {
  return (
    <div className={styles.modalWarning}>
      <span className={styles.modalWarningIcon}>⚠️</span>
      <span>Your request may be <strong>accepted or rejected</strong>. You'll be notified once a decision is made.</span>
    </div>
  );
}

export default function TeacherApplyModal({ onClose, onSuccess }) {
  const form = useTeacherApplicationForm();
  return <TeacherApplicationDialog form={form} onClose={onClose} onSuccess={onSuccess} />;
}

function submitTeacherApplication(form, onSuccess) {
  return async (event) => {
    event.preventDefault();
    form.setError("");
    if (!form.reason.trim()) return form.setError("Please tell us why you'd like to become a teacher.");
    form.setSubmitting(true);
    try {
      onSuccess(await requestTeacherRole(form.reason));
    } catch (error) {
      form.setError(error.message || "Failed to submit. Please try again.");
    } finally {
      form.setSubmitting(false);
    }
  };
}

function TeacherApplicationDialog({ form, onClose, onSuccess }) {
  const handleSubmit = submitTeacherApplication(form, onSuccess);

  return (
    <StandardModal title="Apply for Teacher Role" subtitle="Tell us why you'd like to teach" onClose={onClose} backdropClassName={styles.modalBlurBackdrop}>
      <form onSubmit={handleSubmit}>
        <ReasonField reason={form.reason} setReason={form.setReason} />
        <TeacherWarning />
        <InlineAlert message={form.error} variant="error" />
        <div className={styles.formActions}>
          <PrimaryButton type="submit" disabled={form.submitting} pill>
            {form.submitting ? "Submitting…" : "Submit Application"}
          </PrimaryButton>
        </div>
      </form>
    </StandardModal>
  );
}
