import styles from "./PillFilters.module.css";
import { PILLS } from "../lib/uiConstants";
import { countByType } from "../lib/pillUtils";

function cls(isActive) {
  return isActive ? `${styles.pill} ${styles.active}` : `${styles.pill} ${styles.inactive}`;
}

function PillButton({ pill, isActive, count, onClick }) {
  return (
    <button type="button" className={cls(isActive)} onClick={onClick}>
      <span className={styles.count}>{count}</span> {pill.label}
    </button>
  );
}

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
