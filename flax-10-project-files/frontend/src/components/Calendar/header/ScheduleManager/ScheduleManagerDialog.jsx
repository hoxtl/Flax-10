/*
 * ScheduleManagerDialog.jsx
 * Modal for renaming and deleting saved schedules.
 */

import { useEffect, useState } from "react";
import {
  deleteSchedule,
  getSchedules,
  renameSchedule,
} from "../../../../api/scheduleApi";
import { useToast } from "../../../../context/ToastContext";
import HoldConfirmModal from "../../../common/HoldConfirmModal/HoldConfirmModal";
import PrimaryButton from "../../../common/PrimaryButton/PrimaryButton";
import StandardModal from "../../../common/StandardModal/StandardModal";
import { ScheduleCard } from "./ScheduleCard";
import styles from "../CalendarHeaderUtils.module.css";

function getScheduleList(data) {
  return Array.isArray(data) ? data : [];
}

function updateScheduleName(schedules, scheduleId, title, data) {
  return schedules.map((schedule) =>
    schedule.id === scheduleId
      ? {
          ...schedule,
          title,
          event_allocations: data.event_allocations ?? schedule.event_allocations,
        }
      : schedule,
  );
}

function removeScheduleItem(schedules, scheduleId) {
  return schedules.filter(({ id }) => id !== scheduleId);
}

function openQuickAddSchedule(onClose) {
  window.dispatchEvent(
    new CustomEvent("quick-add:open", { detail: { view: "schedule_auto" } }),
  );
  onClose?.();
}

function useDialogState(open) {
  const state = useDialogFields();
  useResetOnClose(open, state);
  return state;
}

function useDialogFields() {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [removeId, setRemoveId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  return { loading, schedules, editingId, renameDraft, removeId, isSaving, isDeleting, setLoading, setSchedules, setEditingId, setRenameDraft, setRemoveId, setIsSaving, setIsDeleting };
}

function useResetOnClose(open, state) {
  const resetters = createResetters(state.setEditingId, state.setRenameDraft, state.setRemoveId, state.setIsSaving, state.setIsDeleting);
  useEffect(() => !open && resetDialogState(resetters), [open, resetters]);
}

function createResetters(
  setEditingId,
  setRenameDraft,
  setRemoveId,
  setIsSaving,
  setIsDeleting,
) {
  return { setEditingId, setRenameDraft, setRemoveId, setIsSaving, setIsDeleting };
}

function resetDialogState(setters) {
  setters.setEditingId(null);
  setters.setRenameDraft("");
  setters.setRemoveId(null);
  setters.setIsSaving(false);
  setters.setIsDeleting(false);
}

function useScheduleLoader(open, setLoading, setSchedules, showToast) {
  useEffect(() => {
    if (!open) return undefined;
    let ignore = false;
    loadSchedules(setLoading, setSchedules, showToast, () => ignore);
    return () => {
      ignore = true;
    };
  }, [open, setLoading, setSchedules, showToast]);
}

async function loadSchedules(setLoading, setSchedules, showToast, shouldIgnore) {
  setLoading(true);
  try {
    applyLoadedSchedules(setSchedules, shouldIgnore, await getSchedules());
  } catch (error) {
    showLoadError(showToast, shouldIgnore, error);
  } finally {
    finishLoading(setLoading, shouldIgnore);
  }
}

function applyLoadedSchedules(setSchedules, shouldIgnore, data) {
  if (!shouldIgnore()) setSchedules(getScheduleList(data));
}

function showLoadError(showToast, shouldIgnore, error) {
  if (!shouldIgnore()) showToast(error.message, { variant: "error" });
}

function finishLoading(setLoading, shouldIgnore) {
  if (!shouldIgnore()) setLoading(false);
}

function startRename(schedule, setEditingId, setRenameDraft, setRemoveId) {
  setRemoveId(null);
  setEditingId(schedule.id);
  setRenameDraft(schedule.title);
}

function cancelRename(setEditingId, setRenameDraft) {
  setEditingId(null);
  setRenameDraft("");
}

async function saveRename(state, scheduleId, showToast) {
  const nextTitle = state.renameDraft.trim();
  if (!nextTitle) return showToast("Enter a name.", { variant: "error" });
  state.setIsSaving(true);
  try {
    const data = await renameSchedule(scheduleId, nextTitle);
    state.setSchedules((items) => updateScheduleName(items, scheduleId, nextTitle, data));
    cancelRename(state.setEditingId, state.setRenameDraft);
  } catch (error) {
    showToast(error.message, { variant: "error" });
  } finally {
    state.setIsSaving(false);
  }
}

async function confirmDelete(removeId, setIsDeleting, setRemoveId, setSchedules, showToast) {
  if (!removeId) return;
  setIsDeleting(true);
  try {
    await deleteSchedule(removeId);
    setSchedules((items) => removeScheduleItem(items, removeId));
    setRemoveId(null);
    showToast("Schedule deleted.");
  } catch (error) {
    showToast(error.message, { variant: "error" });
  } finally {
    setIsDeleting(false);
  }
}

function ScheduleEmptyState({ onClose }) {
  return (
    <div className={styles.scheduleEmptyActions}>
      <PrimaryButton
        variant="ghost"
        size="small"
        pill
        onClick={() => openQuickAddSchedule(onClose)}
      >
        ⚙️ Auto Schedule
      </PrimaryButton>
    </div>
  );
}

function ScheduleList(props) {
  return (
    <div className={styles.scheduleList}>
      {props.schedules.map((schedule) => (
        <ScheduleListItem key={schedule.id} {...props} schedule={schedule} />
      ))}
    </div>
  );
}

function ScheduleListItem(props) {
  const { editingId, isDeleting, isSaving, schedule } = props;
  return (
    <ScheduleCard
      schedule={schedule}
      editingId={editingId}
      renameDraft={props.renameDraft}
      isSaving={isSaving && editingId === schedule.id}
      isRemoving={isDeleting && props.removeId === schedule.id}
      onRenameStart={props.onRenameStart}
      onRenameCancel={props.onRenameCancel}
      onRenameDraftChange={props.onRenameDraftChange}
      onRenameSave={props.onRenameSave}
      onRemoveRequest={props.onRemoveRequest}
    />
  );
}

function ScheduleDialogBody(props) {
  if (props.loading) return <p className={styles.scheduleDialogEmpty}>Loading schedules…</p>;
  if (props.schedules.length === 0) return <ScheduleEmptyState onClose={props.onClose} />;
  return <ScheduleList {...props} />;
}

function DeleteConfirm({ onCancel, onConfirm, removeId }) {
  if (!removeId) return null;
  return (
    <HoldConfirmModal
      title="Remove Schedule"
      warningText="This cannot be undone."
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

function buildDialogHandlers(state, showToast) {
  return {
    onDelete: () => confirmDelete(state.removeId, state.setIsDeleting, state.setRemoveId, state.setSchedules, showToast),
    onRenameCancel: () => cancelRename(state.setEditingId, state.setRenameDraft),
    onRenameDraftChange: state.setRenameDraft,
    onRenameSave: (scheduleId) => saveRename(state, scheduleId, showToast),
    onRenameStart: (schedule) => startRename(schedule, state.setEditingId, state.setRenameDraft, state.setRemoveId),
    onRemoveRequest: state.setRemoveId,
  };
}

function ScheduleManagerContent({ handlers, onClose, state }) {
  return (
    <StandardModal title="Schedules" subtitle="Manage your saved schedules." onClose={onClose}>
      <div className={styles.scheduleDialogBody}>
        <ScheduleDialogBody {...state} {...handlers} onClose={onClose} />
      </div>
      <DeleteConfirm removeId={state.removeId} onCancel={() => state.setRemoveId(null)} onConfirm={handlers.onDelete} />
    </StandardModal>
  );
}

export function ScheduleManagerDialog({ open, onClose }) {
  const showToast = useToast();
  const state = useDialogState(open);
  const handlers = buildDialogHandlers(state, showToast);
  useScheduleLoader(open, state.setLoading, state.setSchedules, showToast);
  if (!open) return null;
  return <ScheduleManagerContent handlers={handlers} onClose={onClose} state={state} />;
}
