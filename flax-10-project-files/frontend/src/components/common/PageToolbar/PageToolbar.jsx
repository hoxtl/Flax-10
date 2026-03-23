/*
 * Toolbar row for search and control slots on list pages.
 */

import styles from "./PageToolbar.module.css";

/** Sort control label and child slot, used inside a PageToolbar. */

export function ToolbarSortControl({ label = "SORT", children, className = "" }) {
  return (
    <div className={className ? `${styles.sortControl} ${className}` : styles.sortControl}>
      <label className={styles.sortLabel}>{label}</label>
      {children}
    </div>
  );
}

/** Toolbar with a search slot on the left and control slots on the right. */

export default function PageToolbar({ searchSlot, controlsSlot, className = "" }) {
  return (
    <div className={className ? `${styles.toolbar} ${className}` : styles.toolbar}>
      {searchSlot && <div className={styles.searchSlot}>{searchSlot}</div>}
      {controlsSlot && <div className={styles.controls}>{controlsSlot}</div>}
    </div>
  );
}
