/*
 * Shared admin filter controls.
 */

import styles from "../styles";

function FilterPillButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.filterPillButton} ${active ? styles.filterPillButtonActive : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export function FilterToggleGroup({ ariaLabel, onToggle, options, selected }) {
  return (
    <div className={styles.filterGroup} role="group" aria-label={ariaLabel}>
      <div className={styles.filterButtons}>
        {options.map((option) => <FilterPillButton key={option.value} label={option.label} active={selected.includes(option.value)} onClick={() => onToggle(option.value)} />)}
      </div>
    </div>
  );
}
