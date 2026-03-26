<<<<<<< HEAD
/*
 * Filter dropdown and tag manager entrypoint.
 */

import { useState } from "react";
=======
import { useState, useMemo } from "react";
import { Filter } from "lucide-react";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import styles from "./PillFilters.module.css";
import AnimatedDropdown from "../common/animated_dropdown/AnimatedDropdown";
import TagManagerModal from "./TagManagerModal";
<<<<<<< HEAD
import { usePillFilterOptions } from "./pill_filters/usePillFilterOptions";
import { FilterTriggerButton } from "./pill_filters/PillFilterControls";
import { ManageTagsButton } from "./pill_filters/PillFilterControls";
=======
import AnimatedDropdown from "../common/AnimatedDropdown/AnimatedDropdown";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export default function PillFilters({ active, items, onChange }) {
  const [showManager, setShowManager] = useState(false);
<<<<<<< HEAD
  const { activeLabel, options } = usePillFilterOptions({ active, items });
=======
  const counts = countByType(items);

  const options = useMemo(() => {
    const uniqueTags = Array.from(
      new Map((tags || []).map(t => [t.label.toLowerCase(), t])).values()
    );
    return [
      { value: "all", label: `All (${counts["all"] || 0})` },
      ...uniqueTags.map(t => ({
        value: t.label.toLowerCase(),
        label: `${t.label} (${counts[t.label.toLowerCase()] || 0})`,
      })),
    ];
  }, [tags, counts]);

  const activeLabel = options.find(o => o.value === active)?.label || "Filter";

  const trigger = (
    <button className={styles.filterTrigger} type="button">
      <Filter size={15} />
      <span>{activeLabel}</span>
    </button>
  );
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

  return (
    <>
      <div className={styles.row}>
<<<<<<< HEAD
        <AnimatedDropdown align="left" className={styles.filterDropdown} customTrigger={<FilterTriggerButton label={activeLabel} />} onChange={onChange} options={options} value={active} />
        <ManageTagsButton onClick={() => setShowManager(true)} />
=======
        <AnimatedDropdown
          customTrigger={trigger}
          options={options}
          value={active}
          onChange={onChange}
          align="left"
          className={styles.filterDropdown}
        />
        <button
          className={styles.managerBtn}
          onClick={() => setShowManager(true)}
          aria-label="Manage Tags"
          type="button"
        >
          Manage Tags
        </button>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      </div>
      {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
    </>
  );
}
