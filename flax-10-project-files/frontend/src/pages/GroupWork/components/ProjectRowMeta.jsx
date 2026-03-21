/*
 * GroupWork project row meta section.
 */

import ProjectProgressCircle from "./ProjectProgressCircle";
import styles from "./ProjectRow.module.css";

export default function ProjectRowMeta({ dateString, daysLeft, theme, percent, isExpanded }) {
  return (
    <div className={styles.projectMetaArea}>
      <div className={styles.deadlineInfo}>
        <div className={styles.deadlineDate}>{dateString}</div>
        {daysLeft !== null && <div className={`${styles.daysPill} ${styles[theme.pill] || ""}`}>{daysLeft < 0 ? "Past due" : `${daysLeft} days`}</div>}
      </div>
      <div className={styles.progressCircleContainer}>
        <ProjectProgressCircle percent={percent} ringColor={theme.ring} />
      </div>
      <div className={isExpanded ? styles.arrowIconUp : styles.arrowIcon}>↑</div>
    </div>
  );
}
