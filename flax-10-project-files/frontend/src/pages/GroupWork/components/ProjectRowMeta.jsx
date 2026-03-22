/*
 * GroupWork project row meta section.
 */

import { ChevronUp } from "lucide-react";
import DeadlineCountdown from "../../../components/Common/DeadlineCountdown/DeadlineCountdown";
import styles from "./ProjectRow.module.css";

export default function ProjectRowMeta({ date, dateString, tier, isExpanded }) {
  return (
    <div className={styles.projectMetaArea}>
      <div className={styles.deadlineInfo}>
        <div className={styles.deadlineDate}>{dateString}</div>
        {date ? <DeadlineCountdown className={styles.deadlineCountdown} dueDate={date} tier={tier} /> : null}
      </div>
      <div className={`${styles.arrowIcon} ${isExpanded ? styles.arrowIconExpanded : ""}`} aria-hidden="true">
        <ChevronUp size={18} />
      </div>
    </div>
  );
}
