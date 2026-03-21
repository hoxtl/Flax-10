/*
 * GroupWork overview stats cards.
 */

import StatStrip from "../../../components/common/StatStrip/StatStrip";
import { useCountUp } from "../../../hooks/useCountUp";
import styles from "./GroupWorkStats.module.css";
import { getNextDeadline, getProgressStats } from "../utils/projectStatsUtils";

export default function GroupWorkStats({ projects }) {
  const safeProjects = projects || [];
  const progress = getProgressStats(safeProjects);
  const deadline = getNextDeadline(safeProjects);
  const projectCount = safeProjects.length;
  const projectCountRef = useCountUp(projectCount, 1200);
  const deadlineCountRef = useCountUp(deadline.project ? deadline.days : 0, 1200);
  const progressCountRef = useCountUp(progress.percent, 1200);

  return (
    <StatStrip
      className={styles.statsStrip}
      items={[
        {
          key: "active-projects",
          label: "Active projects",
          value: projectCount,
          valueRef: projectCountRef,
        },
        {
          key: "next-deadline",
          label: "Upcoming deadlines",
          value: deadline.project ? deadline.days : "--",
          valueRef: deadline.project ? deadlineCountRef : undefined,
          tooltip: deadline.project ? deadline.project.name : undefined,
          tone: deadline.project ? "danger" : undefined,
        },
        {
          key: "overall-progress",
          label: "Overall progress",
          value: progress.percent,
          valueRef: progressCountRef,
          suffix: "%",
          tone: progress.percent > 0 ? "success" : undefined,
        },
      ]}
    />
  );
}
