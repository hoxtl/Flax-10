/*
 * GroupWork project row.
 */

import DeadlineCountdown from "../../../components/common/DeadlineCountdown/DeadlineCountdown";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import ProjectRowInfo from "./ProjectRowInfo";
import ProjectRowAccordion from "./ProjectRowAccordion";
import { formatProjectHeadlineDate, getDaysLeft, getProjectDate, getProjectMembers, getProjectPercent } from "../utils/projectRowUtils";
import styles from "./ProjectRow.module.css";

export default function ProjectRow({ project, onClick }) {
  const date = getProjectDate(project.deadline);
  const members = getProjectMembers(project);
  const daysLeft = getDaysLeft(date);
  const percent = getProjectPercent(project);
  return (
    <div className={buildContainerClassName(daysLeft)}>
      <div className={styles.projectRow}>
        <ProjectRowInfo
          project={project}
          members={members}
          action={(
            <PrimaryButton type="button" size="small" variant="ghost" pill className={styles.projectDetailsButton} onClick={onClick}>
              View more details
            </PrimaryButton>
          )}
        />
        <div className={styles.projectMetaArea}>
          <div className={styles.deadlineInfo}>
            <div className={styles.deadlineDate}>{formatProjectHeadlineDate(date)}</div>
            <DeadlineCountdown dueDate={date} className={styles.deadlineCountdown} forceClock />
          </div>
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
