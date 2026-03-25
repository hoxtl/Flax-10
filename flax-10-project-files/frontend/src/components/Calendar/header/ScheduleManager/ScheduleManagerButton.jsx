/*
 * ScheduleManagerButton.jsx
 * Shared calendar trigger for clearing overlaps in the active day.
 */

import { useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import { useCalendar } from "../../../../context/CalendarContext";
import { useToast } from "../../../../context/ToastContext";
import ConfirmModal from "../../../common/ConfirmModal/ConfirmModal";
import Tooltip from "../../../common/Tooltip/Tooltip";
import { useCalendarEvents, useEventActions } from "../../hooks/useCalendarEvents";
import { applyConflictResolutionPlan, buildConflictResolutionPlan, buildConflictResolutionToastMessage, undoConflictResolutionPlan } from "../../../common/RescheduleEvents/rescheduleEventConflicts";
import { loadScheduleSettings, loadUpcomingDeadlineItems, submitAutoScheduleWithPrefs } from "../../../Schedules/auto/autoScheduleActions";
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

function AutoScheduleButton({ busy, onClick }) {
  return (
    <Tooltip content="Auto schedule study time">
      <button
        className={styles.settingsBtn}
        onClick={onClick}
        title="Auto schedule study time"
        aria-label="Auto schedule study time"
        type="button"
        disabled={busy}
      >
        <Clock size={18} />
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
  await withBusyState(setBusy, () => runReschedulePlan(plan, editEvent, showToast));
}

async function withBusyState(setBusy, task) {
  setBusy(true);
  try {
    await task();
  } finally {
    setBusy(false);
  }
}

async function runReschedulePlan(plan, editEvent, showToast) {
  try {
    const result = await applyConflictResolutionPlan(plan, editEvent);
    const failureCount = result?.failures?.length ?? 0;
    if (failureCount === plan.operations.length) {
      showToast("Couldn't reschedule your events. Some conflicts are read-only.");
      return;
    }
    showToast(buildScheduleMessage(plan, failureCount));
  } catch {
    showToast("Couldn't reschedule your events. Try again.");
  }
}

function buildScheduleMessage(plan, failureCount) {
  const message = buildConflictResolutionToastMessage(plan);
  return failureCount ? `${message} ${failureCount} couldn't be moved.` : message;
}

async function executeAutoSchedule(showToast, loadEvents, setBusy) {
  setBusy(true);
  try {
    const deadlines = await loadUpcomingDeadlineItems(showToast);
    const settings = await loadScheduleSettings(showToast);
    await submitAutoScheduleWithPrefs({ deadlines, settings, showToast, onDone: loadEvents });
  } finally {
    setBusy(false);
  }
}

function RescheduleConfirmModal({ onConfirm, onCancel }) {
  return (
    <ConfirmModal title="Reschedule my events" message="This will clear movable conflicts in the current day and may move personal events to tomorrow if today has no free window left." confirmText="Reschedule now" cancelText="Keep plan" onConfirm={onConfirm} onCancel={onCancel} infoHint="⚠️ Lectures, societies, exams, and fixed deadlines stay where they are." />
  );
}

function AutoScheduleConfirmModal({ onConfirm, onCancel }) {
  return (
    <ConfirmModal title="Auto schedule study time" message="We'll use your scheduling preferences to place study blocks for upcoming deadlines." confirmText="Auto schedule" cancelText="Not now" onConfirm={onConfirm} onCancel={onCancel} infoHint="⚙️ Uses your daily target, scheduling days, and study time preference." />
  );
}

function useRescheduleState(events, selectedDate, editEvent, showToast) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const confirm = async () => {
    setOpen(false);
    await executeReschedule(events, selectedDate, editEvent, showToast, setBusy);
  };
  return { busy, open, setOpen, confirm };
}

function useAutoScheduleState(showToast, loadEvents) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const confirm = async () => {
    setOpen(false);
    await executeAutoSchedule(showToast, loadEvents, setBusy);
  };
  return { busy, open, setOpen, confirm };
}

export function ScheduleManagerButton() {
  const { events, selectedDate } = useCalendar();
  const { editEvent } = useEventActions();
  const { loadEvents } = useCalendarEvents();
  const showToast = useToast();
  const reschedule = useRescheduleState(events, selectedDate, editEvent, showToast);
  const autoSchedule = useAutoScheduleState(showToast, loadEvents);
  return (
    <>
      <AutoScheduleButton busy={autoSchedule.busy} onClick={() => autoSchedule.setOpen(true)} />
      <TriggerButton busy={reschedule.busy} onClick={() => reschedule.setOpen(true)} />
      {autoSchedule.open ? <AutoScheduleConfirmModal onConfirm={autoSchedule.confirm} onCancel={() => autoSchedule.setOpen(false)} /> : null}
      {reschedule.open ? <RescheduleConfirmModal onConfirm={reschedule.confirm} onCancel={() => reschedule.setOpen(false)} /> : null}
    </>
  );
}
