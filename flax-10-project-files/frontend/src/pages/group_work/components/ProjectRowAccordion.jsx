/*
 * GroupWork project row accordion.
 */

import { motion } from "framer-motion";
import Tooltip from "../../../components/common/Tooltip/Tooltip";
import styles from "./ProjectRowExpanded.module.css";

export default function ProjectRowAccordion({ percent }) {
  return (
    <div className={styles.projectAccordion}>
      <div className={styles.accordionSummary}>
        <Tooltip content={`${percent}% complete`} wrapperClassName={styles.progressTooltipWrap}>
          <div className={styles.progressTrack} aria-label={`${percent}% completion`}>
            <motion.div
              className={styles.progressFill}
              initial={{ width: 0 }}
              animate={{ width: percent > 0 ? `${percent}%` : "0%" }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
