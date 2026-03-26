/*
 * Schedule manager state hook and handlers.
 */

import { useEffect, useState } from "react";
import { deleteSchedule, getSchedules, renameSchedule } from "../../../../api/scheduleApi";

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

function createResetters(state) {
  return {
    setEditingId: state.setEditingId,
    setRenameDraft: state.setRenameDraft,
    setRemoveId: state.setRemoveId,
    setIsSaving: state.setIsSaving,
    setIsDeleting: state.setIsDeleting,
  };
}

function resetDialogState(setters) {
  setters.setEditingId(null);
  setters.setRenameDraft("");
  setters.setRemoveId(null);
  setters.setIsSaving(false);
  setters.setIsDeleting(false);
}

function useResetOnClose(open, state) {
  const resetters = createResetters(state);
  useEffect(() => {
    if (!open) {
      resetDialogState(resetters);
    }
  }, [open, resetters]);
}

function useDialogCoreState() {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  return { loading, schedules, setLoading, setSchedules };
}

function useDialogEditState() {
  const [editingId, setEditingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [removeId, setRemoveId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  return { editingId, renameDraft, removeId, isSaving, isDeleting, setEditingId, setRenameDraft, setRemoveId, setIsSaving, setIsDeleting };
}

function useDialogFields() {
  const core = useDialogCoreState();
  const edit = useDialogEditState();
  return { ...core, ...edit };
}

function applyScheduleData(data, setSchedules, shouldIgnore) {
  if (!shouldIgnore()) setSchedules(getScheduleList(data));
}

function handleScheduleLoadError(error, showToast, shouldIgnore) {
  if (!shouldIgnore()) showToast(error.message, { variant: "error" });
}

function finishScheduleLoad(setLoading, shouldIgnore) {
  if (!shouldIgnore()) setLoading(false);
}

async function loadSchedules(setLoading, setSchedules, showToast, shouldIgnore) {
  setLoading(true);
  try {
    const data = await getSchedules();
    applyScheduleData(data, setSchedules, shouldIgnore);
  } catch (error) {
    handleScheduleLoadError(error, showToast, shouldIgnore);
  } finally {
    finishScheduleLoad(setLoading, shouldIgnore);
  }
}

export function useScheduleManagerState(open, showToast) {
  const state = useDialogFields();
  useResetOnClose(open, state);

  useEffect(() => {
    if (!open) return undefined;
    let ignore = false;
    loadSchedules(state.setLoading, state.setSchedules, showToast, () => ignore);
    return () => {
      ignore = true;
    };
  }, [open, showToast, state.setLoading, state.setSchedules]);

  return state;
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
  if (!nextTitle) {
    showToast("Enter a name.", { variant: "error" });
    return;
  }

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

export function buildScheduleManagerHandlers(state, showToast) {
  return {
    onDelete: () =>
      confirmDelete(
        state.removeId,
        state.setIsDeleting,
        state.setRemoveId,
        state.setSchedules,
        showToast,
      ),
    onRenameCancel: () => cancelRename(state.setEditingId, state.setRenameDraft),
    onRenameDraftChange: state.setRenameDraft,
    onRenameSave: (scheduleId) => saveRename(state, scheduleId, showToast),
    onRenameStart: (schedule) =>
      startRename(schedule, state.setEditingId, state.setRenameDraft, state.setRemoveId),
    onRemoveRequest: state.setRemoveId,
  };
}
