/*
 * GroupWork project row.
 */

import DeadlineCountdown from "../../../components/common/DeadlineCountdown/DeadlineCountdown";
import ProjectRowInfo, { ProjectModuleBadge } from "./ProjectRowInfo";
import ProjectRowAccordion from "./ProjectRowAccordion";
import { getDaysLeft, getProjectDate, getProjectMemberCount, getProjectMembers, getProjectPercent } from "../utils/projectRowUtils";
import styles from "./ProjectRow.module.css";

export default function ProjectRow({ project, onClick }) {
  const date = getProjectDate(project.deadline);
  const members = getProjectMembers(project);
  const memberCount = getProjectMemberCount(project);
  const daysLeft = getDaysLeft(date);
  const percent = getProjectPercent(project);
  return (
    <div className={buildContainerClassName(daysLeft)}>
      <div className={styles.projectRow}>
        <ProjectRowInfo
          project={project}
          members={members}
          totalMembers={memberCount}
          onProjectNavigate={onClick}
        />
        <div className={styles.projectMetaArea}>
          <div className={styles.deadlineInfo}>
            <DeadlineCountdown dueDate={date} className={styles.deadlineCountdown} forceClock />
          </div>
          <ProjectModuleBadge project={project} />
        </div>
      </div>
      <ProjectRowAccordion
        percent={percent}
      />
    </div>
  );
}

function buildContainerClassName(daysLeft) {
  return [
    styles.projectRowContainer,
    daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 ? styles.projectRowContainerUrgent : "",
    daysLeft !== null && daysLeft < 0 ? styles.projectRowContainerOverdue : "",
  ].filter(Boolean).join(" ");
}
