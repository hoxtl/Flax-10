/*
 * GroupWork overview stats cards.
 */

import styles from "./GroupWorkStats.module.css";
import { getCollaboratorCount, getModulesCount, getNextDeadline, getProgressStats } from "../utils/projectStatsUtils";

export default function GroupWorkStats({ projects }) {
  if (!projects || projects.length === 0) return null;
  const progress = getProgressStats(projects);
  const deadline = getNextDeadline(projects);
  return (
    <div className={styles.statsGrid}>
      <StatsCard title="ACTIVE PROJECTS" value={projects.length} subtitle={buildModulesLabel(projects)} />
      <StatsCard title="NEXT DEADLINE" value={deadline.project ? deadline.days : "--"} subtitle={deadline.project ? `days — ${deadline.project.name}` : "No upcoming deadlines"} />
      <StatsCard title="COLLABORATORS" value={getCollaboratorCount(projects)} subtitle="across all projects" />
      <StatsCard title="OVERALL PROGRESS" value={`${progress.percent}%`} subtitle={`${progress.completed} / ${progress.total} tasks done`} />
    </div>
  );
}

function StatsCard({ title, value, subtitle }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>{title}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statSub}>{subtitle}</div>
    </div>
  );
}

function buildModulesLabel(projects) {
  const count = getModulesCount(projects);
  return `across ${count} module${count !== 1 ? "s" : ""}`;
}
