import styles from "./PillFilters.module.css";
import { PILLS } from "../lib/uiConstants";
import { countByType } from "../lib/pillUtils";

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

// Main component that renders the row of pill filters, showing the count for each type and allowing selection
export default function PillFilters({ active, onChange, items }) {
  const counts = countByType(items);
  return (
    <div className={styles.row}>
      {PILLS.map((p) => (
        <PillButton
          key={p.key}
          pill={p}
          isActive={active === p.key}
          count={counts[p.key] || 0}
          onClick={() => onChange(p.key)}
        />
      ))}
    </div>
  );
}
