/*
 * GroupWork project row.
 */

import { useContext } from "react";
import DeadlineCountdown from "../../../components/common/DeadlineCountdown/DeadlineCountdown";
import ProjectRowInfo, { ProjectModuleBadge } from "./ProjectRowInfo";
import ProjectRowAccordion from "./ProjectRowAccordion";
import { AuthContext } from "../../../context/AuthContext";
import {
  getDaysLeft,
  getProjectDate,
  getProjectMemberCount,
  getProjectMembers,
  getProjectPercent,
} from "../utils/projectRowUtils";
import styles from "./ProjectRow.module.css";

function useIsOwner(project) {
  const currentUserId = useContext(AuthContext)?.user?.id;
  return (project.members || []).some((m) => m.role === "owner" && m.user === currentUserId);
}

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
  const isOwner = useIsOwner(project);
  const label = `Open ${project?.name || "project"} details`;
  const handleKeyDown = (event) => {
    if ((event.key === "Enter" || event.key === " ") && onClick) {
      event.preventDefault();
      onClick();
    }
  };
  return (
    <article
      className={`${buildContainerClassName(data.daysLeft)} ${styles.projectRowInteractive}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={label}
    >
      <div className={styles.projectRow}>
        <ProjectRowInfo
          project={project}
          members={data.members}
          totalMembers={data.memberCount}
          isOwner={isOwner}
        />
        <ProjectMetaArea project={project} date={data.date} />
      </div>
      <ProjectRowAccordion percent={data.percent} />
    </article>
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
