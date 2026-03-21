/*
 * Standard back navigation button used across the application.
 */

import styles from './BackButton.module.css';

/** Back button with an arrow icon and configurable label. */
export default function BackButton({ onClick, label = "Back", className = "" }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.backButton} ${className}`} aria-label={label}>
      <span className={styles.arrow}>←</span>
      <span>{label}</span>
    </button>
  );
}
