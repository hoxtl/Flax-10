/*
 * Filter dropdown and tag manager entrypoint.
 */

import { useState } from "react";
import styles from "./PillFilters.module.css";
import AnimatedDropdown from "../common/AnimatedDropdown/AnimatedDropdown";
import TagManagerModal from "./TagManagerModal";
import { usePillFilterOptions } from "./pillFilters/usePillFilterOptions";
import { FilterTriggerButton } from "./pillFilters/PillFilterControls";
import { ManageTagsButton } from "./pillFilters/PillFilterControls";

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
