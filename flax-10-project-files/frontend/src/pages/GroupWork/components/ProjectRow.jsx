/*
 * GroupWork project row.
 */

import DeadlineCountdown from "../../../components/Common/DeadlineCountdown/DeadlineCountdown";
import PrimaryButton from "../../../components/Common/PrimaryButton/PrimaryButton";
import ProjectRowInfo, { ProjectModuleBadge } from "./ProjectRowInfo";
import ProjectRowAccordion from "./ProjectRowAccordion";
import { getDaysLeft, getProjectDate, getProjectMembers, getProjectPercent } from "../utils/projectRowUtils";
import styles from "./ProjectRow.module.css";

function buildContainerClassName(daysLeft) {
  return [
    styles.projectRowContainer,
    daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 ? styles.projectRowContainerUrgent : "",
    daysLeft !== null && daysLeft < 0 ? styles.projectRowContainerOverdue : "",
  ].filter(Boolean).join(" ");
}

function ViewDetailsButton({ onClick }) {
  return (
    <PrimaryButton type="button" size="small" variant="ghost" pill className={styles.projectDetailsButton} onClick={onClick}>
      Schedule times and view more details
    </PrimaryButton>
  );
}

export default function ProjectRow({ project, onClick }) {
  const date = getProjectDate(project.deadline);
  const members = getProjectMembers(project);
  const daysLeft = getDaysLeft(date);
  const percent = getProjectPercent(project);
  return (
    <div className={buildContainerClassName(daysLeft)}>
      <div className={styles.projectRow}>
        <ProjectRowInfo project={project} members={members} action={<ViewDetailsButton onClick={onClick} />} />
        <div className={styles.projectMetaArea}>
          <div className={styles.deadlineInfo}>
            <DeadlineCountdown dueDate={date} className={styles.deadlineCountdown} forceClock />
          </div>
          <ProjectModuleBadge project={project} />
        </div>
      </div>
      <ProjectRowAccordion percent={percent} />
    </div>
  );
}
