/*
 * GroupWork project row.
 */

import { useState } from "react";
import ProjectRowInfo from "./ProjectRowInfo";
import ProjectRowMeta from "./ProjectRowMeta";
import ProjectRowAccordion from "./ProjectRowAccordion";
import { formatProjectDate, getDaysLeft, getProjectDate, getProjectMembers, getProjectPercent, getProjectTheme } from "../utils/projectRowUtils";
import styles from "./ProjectRow.module.css";

export default function ProjectRow({ project, onClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const date = getProjectDate(project.deadline);
  const members = getProjectMembers(project);
  const daysLeft = getDaysLeft(date);
  const percent = getProjectPercent(project);
  return (
    <div className={styles.projectRowContainer}>
      <div className={styles.projectRow} onClick={() => setIsExpanded((value) => !value)}>
        <ProjectRowInfo project={project} members={members} />
        <ProjectRowMeta dateString={formatProjectDate(date)} daysLeft={daysLeft} theme={getProjectTheme(daysLeft)} percent={percent} isExpanded={isExpanded} />
      </div>
      {isExpanded && <ProjectRowAccordion project={project} percent={percent} completedTasks={project.completed_task_count || 0} totalTasks={project.task_count || 0} memberCount={members.length || project.member_count || 1} onClick={onClick} />}
    </div>
  );
}
