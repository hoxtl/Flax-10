import styles from "./FormField.module.css";

export default function FormField({ label, hint, error, htmlFor, children, className = "" }) {
  const classes = className ? `${styles.field} ${className}` : styles.field;

  return (
    <label className={classes} htmlFor={htmlFor}>
      {label && <span className={styles.label}>{label}</span>}
      {children}
      {error ? <span className={styles.error}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}
