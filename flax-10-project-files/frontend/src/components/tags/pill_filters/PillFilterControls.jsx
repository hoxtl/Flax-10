/*
 * Presentational controls for pill filters.
 */

import { Filter } from "lucide-react";
import styles from "../styles/PillFilters.module.css";

export function FilterTriggerButton({ label }) {
  return (
    <button className={styles.filterTrigger} type="button">
      <Filter size={15} />
      <span>{label}</span>
    </button>
  );
}

export function ManageTagsButton({ onClick }) {
  return (
    <button aria-label="Manage Tags" className={styles.managerBtn} onClick={onClick} type="button">
      Manage Tags
    </button>
  );
}
