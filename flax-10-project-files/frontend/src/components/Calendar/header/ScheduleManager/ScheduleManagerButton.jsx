/*
 * ScheduleManagerButton.jsx
 * Shared calendar trigger for clearing overlaps in the active day.
 */

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useCalendar } from "../../../../context/CalendarContext";
import { useToast } from "../../../../context/ToastContext";
import ConfirmModal from "../../../common/ConfirmModal/ConfirmModal";
import Tooltip from "../../../common/Tooltip/Tooltip";
import { useEventActions } from "../../hooks/useCalendarEvents";
import { applyConflictResolutionPlan, buildConflictResolutionPlan, buildConflictResolutionToastMessage, undoConflictResolutionPlan } from "../../../common/RescheduleEvents/rescheduleEventConflicts";
import styles from "../CalendarHeaderUtils.module.css";

function TriggerButton({ busy, onClick }) {
  return (
    <Tooltip content="Reschedule my events">
      <button
        className={styles.settingsBtn}
        onClick={onClick}
        title="Reschedule my events"
        aria-label="Reschedule my events"
        type="button"
        disabled={busy}
      >
        <Sparkles size={18} />
      </button>
    </Tooltip>
  );
}

async function executeReschedule(events, selectedDate, editEvent, showToast, setBusy) {
  const plan = buildConflictResolutionPlan(events, selectedDate);
  if (!plan.operations.length) {
    showToast(buildConflictResolutionToastMessage(plan));
    return;
  }
  setBusy(true);
  try {
    await applyConflictResolutionPlan(plan, editEvent);
    showToast(buildConflictResolutionToastMessage(plan));
  } catch {
    showToast("Couldn't reschedule your events. Try again.");
  } finally {
    setBusy(false);
  }
}

function RescheduleConfirmModal({ onConfirm, onCancel }) {
  return (
    <ConfirmModal title="Reschedule my events" message="This will clear movable conflicts in the current day and may move personal events to tomorrow if today has no free window left." confirmText="Reschedule now" cancelText="Keep plan" onConfirm={onConfirm} onCancel={onCancel} infoHint="⚠️ Lectures, societies, exams, and fixed deadlines stay where they are." />
  );
}

export function ScheduleManagerButton() {
  const { events, selectedDate } = useCalendar();
  const { editEvent } = useEventActions();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const handleConfirm = async () => {
    setShowConfirm(false);
    await executeReschedule(events, selectedDate, editEvent, showToast, setBusy);
  };
  return (
    <>
      <TriggerButton busy={busy} onClick={() => setShowConfirm(true)} />
      {showConfirm ? <RescheduleConfirmModal onConfirm={handleConfirm} onCancel={() => setShowConfirm(false)} /> : null}
    </>
  );
}
