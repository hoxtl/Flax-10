/*
 * Shared form building blocks for module deadline and reading forms.
 */

export function ModuleFormField({ label, children, styles }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  );
}

export function ModuleFormActions({ onCancel, isEditing, createLabel, styles }) {
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
      <button type="submit" className={styles.submitButton}>{isEditing ? "Update" : createLabel}</button>
    </div>
  );
}

export function finishValidation(setError) {
  setError("");
  return true;
}

export function requireFieldValue(value, message, setError) {
  if (value) {
    return true;
  }

  setError(message);
  return false;
}

export function buildValidationState(error, validate) {
  return { error, validate };
}

export function failValidation(setError, message) {
  setError(message);
  return false;
}
