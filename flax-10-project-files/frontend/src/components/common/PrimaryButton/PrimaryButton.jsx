/*
 * Shared action button for consistent CTA styling across the app.
 */

import styles from "./PrimaryButton.module.css";

/** Primary action button with size, variant, and pill shape options. */
export default function PrimaryButton({ children, className = "", disabled = false, type = "button", size = "medium", variant = "primary", pill = false, ...props }) {
  const cls = `${styles.btn} ${styles[size]} ${styles[variant]} ${pill ? styles.pill : ""} ${className}`.trim();
  return (
    <button type={type} disabled={disabled} className={cls} {...props}>
      {children}
    </button>
  );
}
