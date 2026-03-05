/**
 * Shared "all tasks complete" / day complete card.
 * Used on the Tasks page (clear state) and Homepage TODAY'S TASKS slot.
 * Pair with getClearMessage() / getClearCtaLabel() from lib/allTasksCompleteMessages.
 */

import styles from "./AllTasksCompleteCard.module.css";

export default function AllTasksCompleteCard({
  emoji = "🎉",
  message,
  sub,
  /** CTA: either a React node (e.g. Link) or use ctaLabel + onCtaClick for a button */
  children,
  ctaLabel,
  onCtaClick,
}) {
  const hasButton = ctaLabel != null && typeof onCtaClick === "function";
  const hasChildren = children != null;

  return (
    <div className={styles.card}>
      <span className={styles.emoji} aria-hidden>{emoji}</span>
      <p className={styles.message}>{message}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
      {(hasButton || hasChildren) && (
        <div className={styles.cta}>
          {hasButton && (
            <button type="button" className={styles.ctaBtn} onClick={onCtaClick}>
              {ctaLabel}
            </button>
          )}
          {hasChildren && !hasButton && children}
        </div>
      )}
    </div>
  );
}
