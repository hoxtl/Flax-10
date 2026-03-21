/*
 * Form field wrapper with a label, hint, and validation error display.
 */

import styles from "./FormField.module.css";

/** Wraps a form control with a label and optional hint or error message. */
export default function FormField({ label, hint, error, htmlFor, children, className = "" }) {
  return (
    <label className={className ? `${styles.field} ${className}` : styles.field} htmlFor={htmlFor}>
      {label && <span className={styles.label}>{label}</span>}
      {children}
      {error ? <span className={styles.error}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}
