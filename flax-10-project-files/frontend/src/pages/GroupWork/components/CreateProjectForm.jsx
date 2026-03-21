/*
 * GroupWork create project form.
 */

import { useState } from "react";
import Card from "../../../components/common/Card/Card";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import { CreateProjectInputs } from "./CreateProjectInputs";
import { createGroupProject } from "../groupWorkApi";
import styles from "./CreateProjectForm.module.css";

export default function CreateProjectForm({ onCreated }) {
  const formState = useCreateProjectForm(onCreated);
  return (
    <Card className={styles.formCard} padding="sm">
      <FormHeader />
      <form onSubmit={formState.submit} className={styles.createProjectForm}>
        <CreateProjectInputs data={formState.form} onChange={formState.change} errors={formState.errors} />
        <div className={styles.formFooter}>
          {formState.errorMessage && <p className={styles.formError}>{formState.errorMessage}</p>}
          <PrimaryButton type="submit" className={styles.submitBtn} pill>+ Create project</PrimaryButton>
        </div>
      </form>
    </Card>
  );
}

function FormHeader() {
  return (
    <div className={styles.sectionHeader}>
      <h3 className={styles.sectionTitle}>NEW PROJECT</h3>
      <div className={styles.sectionLine} />
    </div>
  );
}

function useCreateProjectForm(onCreated) {
  const [form, setForm] = useState({ name: "", course_code: "", deadline: "" });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  return { form, errors, errorMessage, change: createChangeHandler(setForm, setErrors, setErrorMessage), submit: createSubmitHandler(form, setForm, setErrors, setErrorMessage, onCreated) };
}

function createChangeHandler(setForm, setErrors, setErrorMessage) {
  return (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setErrorMessage("");
  };
}

function createSubmitHandler(form, setForm, setErrors, setErrorMessage, onCreated) {
  return async (event) => {
    event.preventDefault();
    const nextErrors = validateProjectForm(form);
    if (Object.keys(nextErrors).length > 0) return showFormErrors(nextErrors, setErrors, setErrorMessage);
    const created = await createGroupProject(form);
    if (!created) return setErrorMessage("We couldn't create that project. Please try again.");
    onCreated(created);
    resetProjectForm(setForm, setErrors, setErrorMessage);
  };
}

function validateProjectForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Project name is required.";
  if (!form.deadline) errors.deadline = "Deadline is required.";
  return errors;
}

function showFormErrors(nextErrors, setErrors, setErrorMessage) {
  setErrors(nextErrors);
  setErrorMessage("Please fix the highlighted fields.");
}

function resetProjectForm(setForm, setErrors, setErrorMessage) {
  setForm({ name: "", course_code: "", deadline: "" });
  setErrors({});
  setErrorMessage("");
}
