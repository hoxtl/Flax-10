/*
 * Tag edit form and field controls.
 */

import { useState } from "react";
import PrimaryButton from "../../common/primary_button/PrimaryButton";
import styles from "../styles/TagManagerModal.module.css";
import { validateTagForm } from "./tagManagerUtils";

export default function TagForm({ initialData, isProtected = false, onCancel, onSave }) {
  const [form, setForm] = useState(initialData);
  const [error, setError] = useState("");

  return (
    <div className={`${styles.content} ${styles.form}`}>
      <TagNameField
        disabled={isProtected}
        onChange={(label) => updateField({ form, setError, setForm, value: label, field: "label" })}
        value={form.label}
      />
      <TagColorField
        onChange={(color) => updateField({ form, setError, setForm, value: color, field: "color" })}
        value={form.color}
      />
      <TagFormError error={error} />
      <TagFormActions onCancel={onCancel} onSave={() => handleTagSave({ form, isProtected, onSave, setError })} />
    </div>
  );
}

function updateField({ field, form, setError, setForm, value }) {
  setForm({ ...form, [field]: value });
  if (value && value !== form[field]) setError("");
}

function handleTagSave({ form, isProtected, onSave, setError }) {
  const error = validateTagForm(form, isProtected);
  if (error) return setError(error);
  return onSave(form);
}

function TagNameField({ disabled, onChange, value }) {
  return (
    <label>
      Name
      <input disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder="e.g. Gym" value={value} />
    </label>
  );
}

function TagColorField({ onChange, value }) {
  return (
    <label>
      Color
      <div className={styles.colorRow}>
        <input onChange={(event) => onChange(event.target.value)} type="color" value={value} />
        <span style={{ color: value }}>{value}</span>
      </div>
    </label>
  );
}

function TagFormError({ error }) {
  if (!error) return null;
  return <div className={styles.error}>{error}</div>;
}

function TagFormActions({ onCancel, onSave }) {
  return (
    <div className={styles.formActions}>
      <PrimaryButton className={styles.formActionBtn} onClick={onCancel} type="button" variant="ghost">
        Cancel
      </PrimaryButton>
      <PrimaryButton className={styles.formActionBtn} onClick={onSave} type="button" variant="primary">
        Save
      </PrimaryButton>
    </div>
  );
}
