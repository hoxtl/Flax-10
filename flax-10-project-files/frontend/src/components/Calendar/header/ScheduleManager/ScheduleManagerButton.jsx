/*
 * ScheduleManagerButton.jsx
 * Trigger button for the schedule manager dialog.
 */

import { useState } from "react";
import { FolderKanban } from "lucide-react";
import styles from "../CalendarHeaderUtils.module.css";
import { ScheduleManagerDialog } from "./ScheduleManagerDialog";

function TriggerButton({ onClick }) {
  return (
    <button
      className={styles.settingsBtn}
      onClick={onClick}
      title="Manage schedules"
      aria-label="Manage schedules"
      type="button"
    >
      <FolderKanban size={18} />
    </button>
  );
}

export function ScheduleManagerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TriggerButton onClick={() => setOpen(true)} />
      <ScheduleManagerDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
