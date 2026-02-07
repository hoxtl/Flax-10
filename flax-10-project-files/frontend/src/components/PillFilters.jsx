import { useState } from "react";
import styles from "./PillFilters.module.css";
import { countByType } from "../utils/pillUtils";
import { useTags } from "../context/TagContext";
import TagManagerModal from "./TagManagerModal";

// Button component for each pill filter
function cls(isActive) {
  return isActive ? `${styles.pill} ${styles.active}` : `${styles.pill} ${styles.inactive}`;
}

// Renders a single pill button with the label, count, and active state
function PillButton({ pill, isActive, count, onClick }) {
  return (
    <button type="button" className={cls(isActive)} onClick={onClick}>
      <span className={styles.count}>{count}</span> {pill.label}
    </button>
  );
}

// Main component that renders the row of pill filters
export default function PillFilters({ active, onChange, items }) {
  const { tags } = useTags();
  const [showManager, setShowManager] = useState(false);
  const counts = countByType(items);

  const allPills = [
    { key: "all", label: "All" },
    ...tags.map(t => ({ key: t.id, label: t.label }))
  ];

  return (
    <>
      <div className={styles.row}>
        {allPills.map((p) => {
          const isActive = Array.isArray(active) ? active === p.key || active.includes(p.key) : active === p.key;
          return (
            <PillButton
              key={p.key}
              pill={p}
              isActive={isActive}
              count={counts[p.key] || 0}
              onClick={() => onChange(p.key)}
            />
          );
        })}
        <button
          className={`${styles.pill} ${styles.inactive}`}
          onClick={() => setShowManager(true)}
          aria-label="Manage Tags"
        >
          ✎
        </button>
      </div>
      {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
    </>
  );
}
