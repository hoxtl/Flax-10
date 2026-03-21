/*
 * Single row item used inside GenericSummaryModal with optional avatar and right action.
 */

import styles from "./GenericSummaryModal.module.css";

/** Clickable or static row within a summary modal list. */
export default function SummaryItem({ avatar, title, subtitle, onClick, rightAction }) {
  const isClickable = Boolean(onClick);
  return (
    <div className={`${styles.item} ${isClickable ? styles.clickable : ''}`}
      onClick={onClick} role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onClick && onClick()}>
      {avatar && <div className={styles.avatarWrapper}>{avatar}</div>}
      <div className={styles.info}>
        <div className={styles.title}>{title}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
      {rightAction && <div className={styles.rightAction} onClick={e => e.stopPropagation()}>{rightAction}</div>}
    </div>
  );
}
