/*
 * Shared admin filter controls.
 */

import Badge from "../../../components/common/Badge/Badge";
import styles from "../AdminPage.module.css";

function FilterPillButton({ active, label, onClick }) {
  return (
    <button type="button" className={styles.filterPillButton} onClick={onClick}>
      <Badge tone={active ? "default" : "muted"} className={active ? styles.filterPillBadgeActive : styles.filterPillBadge}>{label}</Badge>
    </button>
  );
}

export function FilterToggleGroup({ onToggle, options, selected }) {
  return (
    <div className={styles.filterGroup}>
      <div className={styles.filterButtons}>
        {options.map((option) => <FilterPillButton key={option.value} label={option.label} active={selected.includes(option.value)} onClick={() => onToggle(option.value)} />)}
      </div>
    </div>
  );
}
