/*
 * Reusable filter button with funnel icon, "Filter" label, and active badge.
 */

import styles from "./FilterButton.module.css";

function FunnelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export default function FilterButton({ activeCount = 0, isOpen = false, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.filterBtn} ${activeCount > 0 ? styles.filterBtnActive : ""} ${className}`.trim()}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
    >
      <FunnelIcon />
      Filter
      {activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
    </button>
  );
}
