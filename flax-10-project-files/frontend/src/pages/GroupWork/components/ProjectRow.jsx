/*
 * GroupWork project row.
 */

import DeadlineCountdown from "../../../components/common/DeadlineCountdown/DeadlineCountdown";
import ProjectRowInfo, { ProjectModuleBadge } from "./ProjectRowInfo";
import ProjectRowAccordion from "./ProjectRowAccordion";
import {
  getDaysLeft,
  getProjectDate,
  getProjectMemberCount,
  getProjectMembers,
  getProjectPercent,
} from "../utils/projectRowUtils";
import styles from "./ProjectRow.module.css";

function ProjectMetaArea({ project, date }) {
  return (
    <div className={styles.projectMetaArea}>
      <div className={styles.deadlineInfo}>
        <DeadlineCountdown dueDate={date} className={styles.deadlineCountdown} forceClock />
      </div>
      <ProjectModuleBadge project={project} />
    </div>
  );
}

export default function ProjectRow({ project, onClick }) {
  const data = getProjectRowData(project);
  return (
    <div className={buildContainerClassName(data.daysLeft)}>
      <div className={styles.projectRow}>
        <ProjectRowInfo
          project={project}
          members={data.members}
          totalMembers={data.memberCount}
          onProjectNavigate={onClick}
        />
        <ProjectMetaArea project={project} date={data.date} />
      </div>
      <ProjectRowAccordion percent={data.percent} />
    </div>
  );
}

function getProjectRowData(project) {
  const date = getProjectDate(project.deadline);
  return {
    date,
    members: getProjectMembers(project),
    memberCount: getProjectMemberCount(project),
    daysLeft: getDaysLeft(date),
    percent: getProjectPercent(project),
  };
}

function buildContainerClassName(daysLeft) {
  return [
    styles.projectRowContainer,
    daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 ? styles.projectRowContainerUrgent : "",
    daysLeft !== null && daysLeft < 0 ? styles.projectRowContainerOverdue : "",
  ]
    .filter(Boolean)
    .join(" ");
}
