/*
 * Generic empty state block for lists and grids with no items to show.
 */

import styles from "./EmptyState.module.css";

/** Empty state with an icon, title, description, and optional action. */

export default function EmptyState({ icon = "🔍", title, description, action }) {
  return (
    <div className={styles.wrap}>
      <span className={styles.icon}>{icon}</span>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
