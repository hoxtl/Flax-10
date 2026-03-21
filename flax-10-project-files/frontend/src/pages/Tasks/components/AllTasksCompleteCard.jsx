/*
 * Card shown when a section has no tasks or all are complete.
 */

import styles from "./AllTasksCompleteCard.module.css";
import CelebrationEmoji from "../../../components/common/motion/CelebrationEmoji";

function CtaBlock({ ctaLabel, onCtaClick, children }) {
  const hasButton = ctaLabel != null && typeof onCtaClick === "function";
  const hasChildren = children != null;
  if (!hasButton && !hasChildren) return null;
  return (
    <div className={styles.cta}>
      {hasButton && <button type="button" className={styles.ctaBtn} onClick={onCtaClick}>{ctaLabel}</button>}
      {hasChildren && !hasButton && children}
    </div>
  );
}

export default function AllTasksCompleteCard({
  emoji = "🎉",
  message,
  sub,
  children,
  ctaLabel,
  onCtaClick,
}) {
  return (
    <div className={styles.card}>
      <CelebrationEmoji emoji={emoji} className={styles.emoji} />
      <p className={styles.message}>{message}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
      <CtaBlock ctaLabel={ctaLabel} onCtaClick={onCtaClick}>{children}</CtaBlock>
    </div>
  );
}
