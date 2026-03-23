/*
 * Modal for requesting a course change.
 */

import { useState } from "react";
import { requestCourseChange } from "../../../api/adminApi";
import styles from "../../../pages/Settings/Settings.module.css";
import AnimatedDropdown from "../../common/AnimatedDropdown/AnimatedDropdown";
import InlineAlert from "../../common/InlineAlert/InlineAlert";
import PrimaryButton from "../../common/PrimaryButton/PrimaryButton";
import StandardModal from "../../common/StandardModal/StandardModal";
import { groupedCourses } from "./accountCourseRequests";

function useCourseRequestForm() {
  const [reason, setReason] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  return { reason, setReason, selectedCourse, setSelectedCourse, submitting, setSubmitting, error, setError };
}

function validateCourseRequest(reason, selectedCourse, setError) {
  if (!reason.trim()) return setError("Please tell us why you want to change course.");
  return selectedCourse ? true : setError("Please select a course.");
}

function CourseReasonField({ reason, setReason }) {
  return (
    <div className={styles.formGroup}>
      <label>
        Why do you want to change?
        <span className={styles.requiredAsterisk} aria-hidden="true"> *</span>
      </label>
      <textarea className={styles.modalTextarea} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell us a bit about why you'd like to switch..." rows={3} required />
    </div>
  );
}

function CourseSelectionField({ selectedCourse, setSelectedCourse }) {
  return (
    <div className={styles.formGroup}>
      <label>
        Desired course
        <span className={styles.requiredAsterisk} aria-hidden="true"> *</span>
      </label>
      <CourseDropdown selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} />
    </div>
  );
}

function CourseDropdown({ selectedCourse, setSelectedCourse }) {
  return <AnimatedDropdown value={selectedCourse} onChange={setSelectedCourse} options={groupedCourses} grouped searchable usePortal placeholder="Search for a course..." searchPlaceholder="Type to search courses" emptyMessage="No courses found" menuMaxHeight={220} />;
}

function ModalWarning() {
  return (
    <div className={styles.modalWarning}>
      <span className={styles.modalWarningIcon}>⚠️</span>
      <span>Your request may be <strong>accepted or rejected</strong>. You'll be notified once a decision is made.</span>
    </div>
  );
}

function SubmitAction({ submitting }) {
  return (
    <div className={styles.formActions}>
      <PrimaryButton type="submit" disabled={submitting} pill>
        {submitting ? "Submitting…" : "Submit Request"}
      </PrimaryButton>
    </div>
  );
}

export default function CourseChangeModal({ onClose, onSuccess }) {
  const form = useCourseRequestForm();
  return <CourseChangeModalContent form={form} onClose={onClose} onSuccess={onSuccess} />;
}

function submitCourseRequest(form, onSuccess) {
  return async (event) => {
    event.preventDefault();
    form.setError("");
    if (!validateCourseRequest(form.reason, form.selectedCourse, form.setError)) return;
    form.setSubmitting(true);
    try {
      onSuccess(await requestCourseChange(form.selectedCourse), form.selectedCourse);
    } catch (error) {
      form.setError(error.message || "Failed to submit. Please try again.");
    } finally {
      form.setSubmitting(false);
    }
  };
}

function CourseChangeModalContent({ form, onClose, onSuccess }) {
  const handleSubmit = submitCourseRequest(form, onSuccess);

  return (
    <StandardModal title="Request Course Change" subtitle="Your request will be reviewed by an admin" onClose={onClose} backdropClassName={styles.modalBlurBackdrop}>
      <form onSubmit={handleSubmit}>
        <CourseReasonField reason={form.reason} setReason={form.setReason} />
        <CourseSelectionField selectedCourse={form.selectedCourse} setSelectedCourse={form.setSelectedCourse} />
        <ModalWarning />
        <InlineAlert message={form.error} variant="error" />
        <SubmitAction submitting={form.submitting} />
      </form>
    </StandardModal>
  );
}
