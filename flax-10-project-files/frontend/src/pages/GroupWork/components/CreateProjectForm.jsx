/*
 * GroupWork create project form.
 */

import { useState } from "react";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import StandardModal from "../../../components/common/StandardModal/StandardModal";
import { CreateProjectInputs } from "./CreateProjectInputs";
import { createGroupProject } from "../groupWorkApi";
import styles from "./CreateProjectForm.module.css";

export default function CreateProjectForm({ onCreated, className = "", size = "medium" }) {
  const [isOpen, setIsOpen] = useState(false);
  const formState = useCreateProjectForm((project) => {
    onCreated?.(project);
    setIsOpen(false);
  });
  return (
    <>
      <PrimaryButton type="button" size={size} className={className ? `${styles.triggerBtn} ${className}` : styles.triggerBtn} pill onClick={() => setIsOpen(true)}>
        + Create project
      </PrimaryButton>
      {isOpen && (
        <CreateProjectModal
          formState={formState}
          onClose={() => closeModal(setIsOpen, formState.reset)}
        />
      )}
    </>
  );
}

function CreateProjectModal({ formState, onClose }) {
  return (
    <StandardModal
      title="Create project"
      subtitle="Start a shared project, connect it to a module, and keep the deadline clear from day one."
      onClose={onClose}
      size="sm"
      contentClassName={styles.modalContent}
    >
      <form onSubmit={formState.submit} className={styles.modalForm}>
        <div className={styles.formFields}>
          <CreateProjectInputs data={formState.form} onChange={formState.change} errors={formState.errors} />
        </div>
        {formState.errorMessage && <p className={styles.formError}>{formState.errorMessage}</p>}
        <div className={styles.formFooter}>
          <PrimaryButton type="button" variant="ghost" className={styles.cancelBtn} onClick={onClose} disabled={formState.isSubmitting}>
            Cancel
          </PrimaryButton>
          <PrimaryButton type="submit" className={styles.submitBtn} pill disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Creating..." : "+ Create project"}
          </PrimaryButton>
        </div>
      </form>
    </StandardModal>
  );
}

function closeModal(setIsOpen, reset) {
  setIsOpen(false);
  reset();
}

function useCreateProjectForm(onCreated) {
  const [form, setForm] = useState({ name: "", course_code: "", deadline: "" });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reset = () => resetProjectForm(setForm, setErrors, setErrorMessage, setIsSubmitting);
  return {
    form,
    errors,
    errorMessage,
    isSubmitting,
    reset,
    change: createChangeHandler(setForm, setErrors, setErrorMessage),
    submit: createSubmitHandler(form, setForm, setErrors, setErrorMessage, setIsSubmitting, onCreated),
  };
}

function createChangeHandler(setForm, setErrors, setErrorMessage) {
  return (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setErrorMessage("");
  };
}

function createSubmitHandler(form, setForm, setErrors, setErrorMessage, setIsSubmitting, onCreated) {
  return async (event) => {
    event.preventDefault();
    const nextErrors = validateProjectForm(form);
    if (Object.keys(nextErrors).length > 0) return showFormErrors(nextErrors, setErrors, setErrorMessage);
    setIsSubmitting(true);
    const created = await createGroupProject(form);
    if (!created) {
      setIsSubmitting(false);
      return setErrorMessage("We couldn't create that project. Please try again.");
    }
    onCreated?.(created);
    resetProjectForm(setForm, setErrors, setErrorMessage, setIsSubmitting);
  };
}

function validateProjectForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Project name is required.";
  if (!form.deadline) errors.deadline = "Due date is required.";
  return errors;
}

function showFormErrors(nextErrors, setErrors, setErrorMessage) {
  setErrors(nextErrors);
  setErrorMessage("Please fix the highlighted fields.");
}

function resetProjectForm(setForm, setErrors, setErrorMessage, setIsSubmitting) {
  setForm({ name: "", course_code: "", deadline: "" });
  setErrors({});
  setErrorMessage("");
  setIsSubmitting(false);
}
