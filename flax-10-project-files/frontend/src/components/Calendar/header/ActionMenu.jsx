/*
 * ActionMenu.jsx
 * Quick actions for adding events and importing timetables.
 */

import { Plus } from "lucide-react";
import AnimatedDropdown from "../../common/AnimatedDropdown";
import styles from "./CalendarHeaderUtils.module.css";

const ACTION_OPTIONS = [
  { label: "Add Event", value: "add" },
  { label: "Import Timetable", value: "import" },
];

function ActionTrigger() {
  return (
    <button type="button" className={styles.actionBtn} aria-label="Actions">
      <Plus size={18} />
    </button>
  );
}

function handleActionChange(value, onAddEvent, onImport) {
  if (value === "add") return onAddEvent();
  return onImport();
}

export function ActionMenu({ onAddEvent, onImport, isMobile = false }) {
  return (
    <AnimatedDropdown
      className={styles.actionMenu}
      customTrigger={<ActionTrigger />}
      options={ACTION_OPTIONS}
      hideCheckmark={true}
      onChange={(value) => handleActionChange(value, onAddEvent, onImport)}
      align="right"
      openOnHover={!isMobile}
    />
  );
}
