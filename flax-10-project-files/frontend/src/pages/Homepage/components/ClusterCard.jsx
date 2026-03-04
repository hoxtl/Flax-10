/**
 * Single event card inside an OverlapCluster.
 */
import styles from "../Homepage.module.css";

export function ClusterCard({ item, icon, accentColor, borderColor, durationMins, onDelete, onEdit }) {
  const title = item?.title || "Event";
  return (
    <div
      className={styles.clusterCard}
      style={{ borderLeftColor: accentColor ?? "#94A3B8", borderColor: borderColor ?? "rgba(0,0,0,0.08)" }}
    >
      <div className={styles.clusterCardHeader}>
        <span className={styles.clusterCardIcon} aria-hidden>{icon ?? "📅"}</span>
        {durationMins != null && <span className={styles.clusterCardDuration}>{durationMins}m</span>}
      </div>
      <div className={styles.clusterCardTitle}>{title}</div>
      <div className={styles.clusterCardActions}>
        {onEdit && <button type="button" className={styles.clusterCardBtn} onClick={() => onEdit(item)}>Edit</button>}
        {onDelete && <button type="button" className={styles.clusterCardBtn} onClick={() => onDelete(item.id)}>Delete</button>}
      </div>
    </div>
  );
}
