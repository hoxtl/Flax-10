/*
 * Section-level header with eyebrow, title, subtitle, and action slot.
 */

import styles from "./SectionHeader.module.css";

/** Section header with an optional eyebrow label and right-aligned action. */

export default function SectionHeader({ eyebrow, title, subtitle, action, className = "" }) {
  return (
    <div className={className ? `${styles.header} ${className}` : styles.header}>
      <div className={styles.copy}>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
