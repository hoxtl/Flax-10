/*
 * Filter dropdown and tag manager entrypoint.
 */

import { useState } from "react";
import styles from "../styles/PillFilters.module.css";
import AnimatedDropdown from "../../common/animated_dropdown/AnimatedDropdown";
import TagManagerModal from "./TagManagerModal";
import { usePillFilterOptions } from "../pill_filters/usePillFilterOptions";
import { FilterTriggerButton } from "../pill_filters/PillFilterControls";
import { ManageTagsButton } from "../pill_filters/PillFilterControls";

export default function PillFilters({ active, items, onChange }) {
  const [showManager, setShowManager] = useState(false);
  const { activeLabel, options } = usePillFilterOptions({ active, items });

  return (
    <>
      <div className={styles.row}>
        <AnimatedDropdown align="left" className={styles.filterDropdown} customTrigger={<FilterTriggerButton label={activeLabel} />} onChange={onChange} options={options} value={active} />
        <ManageTagsButton onClick={() => setShowManager(true)} />
      </div>
      {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
    </>
  );
}
