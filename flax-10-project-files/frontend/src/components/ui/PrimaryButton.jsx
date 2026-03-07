import styles from "./PrimaryButton.module.css";

/**
 * Primary action button with consistent padding and rounded corners (6–8px).
 * Use for main CTAs (Save, Submit, Add task, etc.).
 */
export default function PrimaryButton({
  children,
  className = "",
  disabled = false,
  type = "button",
  size = "medium",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${styles.btn} ${styles[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
