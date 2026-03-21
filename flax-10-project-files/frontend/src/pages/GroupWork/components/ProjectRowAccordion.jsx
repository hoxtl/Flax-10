/*
 * GroupWork project row accordion.
 */

import styles from "./ProjectRow.module.css";

export default function ProjectRowAccordion({ percent, completedTasks, totalTasks, memberCount, onClick }) {
  return (
    <div className={styles.projectAccordion}>
      <div className={styles.accordionStats}>
        <StatBlock label="COMPLETION" value={`${percent}%`} />
        <StatBlock label="MEMBERS" value={memberCount} />
        <StatBlock label="TASKS DONE" value={`${completedTasks}/${totalTasks}`} />
      </div>
      <div className={styles.accordionActions}>
        <button className={styles.btnOpen} onClick={(event) => handleOpenProject(event, onClick)}>Open project →</button>
      </div>
    </div>
  );
}

function handleOpenProject(event, onClick) {
  event.stopPropagation();
  onClick();
}

function StatBlock({ label, value }) {
  return (
    <div className={styles.statBlock}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
