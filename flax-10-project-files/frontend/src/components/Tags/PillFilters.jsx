import { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import styles from "./PillFilters.module.css";
import { countByType } from "./utils/pillUtils";
import { useTags } from "../../context/TagContext";
import TagManagerModal from "./TagManagerModal";
import AnimatedDropdown from "../Common/AnimatedDropdown/AnimatedDropdown";

export default function PillFilters({ active, onChange, items }) {
  const { tags } = useTags();
  const [showManager, setShowManager] = useState(false);
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

  return (
    <>
      <div className={styles.row}>
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
      </div>
      {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
    </>
  );
}
