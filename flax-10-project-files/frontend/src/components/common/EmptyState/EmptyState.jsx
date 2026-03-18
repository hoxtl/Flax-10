import styles from "./EmptyState.module.css";

/**
 * Shared empty-state block used when a list or grid has no items to show.
 * Props:
 *   icon        – emoji or character, default "🔍"
 *   title       – required short message, e.g. "No modules found"
 *   description – optional secondary line, e.g. "Try adjusting your filters"
 *   action      – optional ReactNode (e.g. a button to create an item)
 */
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
