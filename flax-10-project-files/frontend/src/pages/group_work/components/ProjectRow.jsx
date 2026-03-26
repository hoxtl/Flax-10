/*
 * GroupWork project row.
 */

import { useCallback, useContext, useMemo } from "react";
import DeadlineCountdown from "../../../components/common/deadline_countdown/DeadlineCountdown";
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
  const auth = useContext(AuthContext);
  const currentUserId = auth?.profile?.id ?? auth?.user?.id;
  return (project.members || []).some(
    (m) => m.role === "owner" && String(m.user) === String(currentUserId),
  );
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

function useProjectRowViewModel(project, onClick) {
  const data = useMemo(() => getProjectRowData(project), [project]);
  const isOwner = useIsOwner(project);
  const label = useMemo(() => `Open ${project?.name || "project"} details`, [project?.name]);
  const handleKeyDown = useCallback(
    (event) => {
      if ((event.key === "Enter" || event.key === " ") && onClick) {
        event.preventDefault();
        onClick();
      }
    },
    [onClick],
  );
  const containerClassName = useMemo(() => buildContainerClassName(data.daysLeft), [data.daysLeft]);
  return { data, isOwner, label, handleKeyDown, containerClassName };
}

export default function ProjectRow({ project, onClick }) {
  const { data, isOwner, label, handleKeyDown, containerClassName } = useProjectRowViewModel(
    project,
    onClick,
  );
  return (
    <ProjectRowCard
      project={project}
      onClick={onClick}
      data={data}
      isOwner={isOwner}
      label={label}
      handleKeyDown={handleKeyDown}
      containerClassName={containerClassName}
    />
  );
}

function ProjectRowCard({ project, onClick, data, isOwner, label, handleKeyDown, containerClassName }) {
  const articleProps = buildProjectRowArticleProps(onClick, handleKeyDown, label, containerClassName);
  return (
    <article {...articleProps}>
      <ProjectRowContent project={project} data={data} isOwner={isOwner} />
      <ProjectRowAccordion percent={data.percent} />
    </article>
  );
}

function buildProjectRowArticleProps(onClick, handleKeyDown, label, containerClassName) {
  return {
    className: `${containerClassName} ${styles.projectRowInteractive}`,
    role: "button",
    tabIndex: 0,
    onClick,
    onKeyDown: handleKeyDown,
    "aria-label": label,
  };
}

function ProjectRowContent({ project, data, isOwner }) {
  return (
    <div className={styles.projectRow}>
      <ProjectRowInfo
        project={project}
        members={data.members}
        totalMembers={data.memberCount}
        isOwner={isOwner}
      />
      <ProjectMetaArea project={project} date={data.date} />
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
