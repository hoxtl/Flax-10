/*
 * Reusable pill button for tag filters.
 */

import styles from "./PillFilters.module.css";

export default function BasePill({ color, count, isActive, label, onClick }) {
  const className = isActive ? `${styles.pill} ${styles.active}` : `${styles.pill} ${styles.inactive}`;
  const activeStyle = isActive && color ? { backgroundColor: color, boxShadow: `0 6px 18px ${color}30` } : {};

  return (
    <button className={className} onClick={onClick} style={activeStyle} type="button">
      {color && !isActive && <span className={styles.colorDot} style={{ backgroundColor: color }} />}
      {count !== undefined && <span className={styles.count}>{count}</span>}
      {label}
    </button>
  );
}
