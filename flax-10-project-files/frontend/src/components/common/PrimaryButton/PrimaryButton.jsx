import styles from "./PrimaryButton.module.css";

/**
 * Shared action button for consistent CTA styling across the app.
 */
export default function PrimaryButton({
  children,
  className = "",
  disabled = false,
  type = "button",
  size = "medium",
  variant = "primary",
  pill = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${styles.btn} ${styles[size]} ${styles[variant]} ${pill ? styles.pill : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
