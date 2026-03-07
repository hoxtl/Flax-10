import styles from "./EmptyStateCard.module.css";

/** Simple checkmark-in-circle icon for "all caught up" / empty states. */
function DoneIcon({ className }) {
  return (
    <svg
      className={className}
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="40" cy="40" r="36" fill="rgba(123, 103, 81, 0.12)" stroke="rgba(123, 103, 81, 0.25)" strokeWidth="2" />
      <path
        d="M24 40 L34 50 L56 28"
        stroke="var(--primary, #7B6751)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function EmptyStateCard({
  displayName,
  sub = "No overdue or due-soon tasks.",
  message: messageOverride,
  action,
}) {
  const name = (displayName || "").trim() || "friend";
  const message = messageOverride ?? `The garden is at peace. You've earned your rest, ${name}.`;

  return (
    <div className={styles.wrap}>
      <DoneIcon className={styles.illustration} />
      <p className={styles.message}>{message}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
