import { useState } from "react";
import styles from "./PillFilters.module.css";
import { countByType } from "./utils/pillUtils";
import { useTags } from "../../context/TagContext";
import TagManagerModal from "./TagManagerModal";
import BasePill from "./BasePill";

export default function PillFilters({ active, onChange, items }) {
  const { tags } = useTags();
  const [showManager, setShowManager] = useState(false);
  const counts = countByType(items);
  const pills = getAllPills(tags);
  return (
    <>
      <div className={styles.row}>
        {pills.map((p) => (
          <PillItem
            key={p.id} pill={p} active={active}
            counts={counts} onChange={onChange}
          />
        ))}
        <ManagerButton onClick={() => setShowManager(true)} />
      </div>
      {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
    </>
  );
}

/**
 * Combines the static 'All' option with dynamic tags from context.
 */
function getAllPills(tags) {
  return [
    { id: "all", key: "all", label: "All" },
    ...tags.map(t => ({ id: t.id, key: t.label.toLowerCase(), label: t.label, color: t.color })),
  ];
}

/**
 * Renders an individual pill button.
 */
function PillItem({ pill, active, counts, onChange }) {
  return (
    <BasePill
      label={pill.label}
      count={counts[pill.key] || 0}
      isActive={checkActive(active, pill.key)}
      onClick={() => onChange(pill.key)}
      color={pill.color}
    />
  );
}

/**
 * Checks if a specific key is currently active in the filter state.
 * Handles both string (single) and array (multi) active states.
 */
function checkActive(active, key) {
  if (Array.isArray(active)) return active.includes(key);
  return active === key;
}

function ManagerButton({ onClick }) {
  return <button className={`${styles.pill} ${styles.inactive}`} onClick={onClick} aria-label="Manage Tags">✎</button>;
}