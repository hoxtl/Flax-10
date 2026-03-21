/*
 * GroupWork project row accordion.
 */

import Tooltip from "../../../components/common/Tooltip/Tooltip";
import styles from "./ProjectRow.module.css";

export default function ProjectRowAccordion({ percent }) {
  return (
    <div className={styles.projectAccordion}>
      <div className={styles.accordionSummary}>
        <Tooltip content={`${percent}% complete`} wrapperClassName={styles.progressTooltipWrap}>
          <div className={styles.progressTrack} aria-label={`${percent}% completion`}>
            <div className={styles.progressFill} style={{ width: percent > 0 ? `${percent}%` : "0%" }} />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
