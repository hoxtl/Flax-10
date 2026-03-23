/*
 * Homepage empty state card.
 */

import styles from "./EmptyStateCard.module.css";

function DoneIcon({ className }) {
  return (
    <svg className={className} width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="40" cy="40" r="36" className={styles.doneCircle} strokeWidth="2" />
      <path d="M24 40 L34 50 L56 28" className={styles.doneCheck} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export default function EmptyStateCard({
  sub = "No overdue or due-soon tasks.",
  message: messageOverride,
  action,
}) {
  const message = messageOverride ?? "All caught up. You've earned your rest.";

  return (
    <div className={styles.wrap}>
      <DoneIcon className={styles.illustration} />
      <p className={styles.message}>{message}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
