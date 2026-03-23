/**
 * Homepage action handlers.
 */

import { useCallback, useRef } from "react";
import { updateTask, deleteTask } from "../../../api/taskApi";
import { getCompletionMessage, isRoutineTask } from "../../../lib/completionMessages";

function getTaskId(task) {
  if (typeof task.id !== "string") return task.id;
  return task.id.startsWith("task-") ? Number(task.id.replace("task-", "")) : task.id;
}

function playTaskCompleteSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export function useHomepageActions(props) {
  const taskWidgetRef = useRef(null);
  const handleTaskWidgetComplete = useTaskWidgetComplete(props);
  const handleTaskToggle = useTaskToggle(props);
  const openTimelinePopup = useTimelinePopup(props.openPopup);
  const deleteTaskAndRefresh = useDeleteTaskAndRefresh(props.refetchTasks);
  const handleInlineTaskEdit = useInlineTaskEdit(props.refetchTasks);

  return {
    deleteTaskAndRefresh,
    handleTaskToggle,
    handleTaskWidgetComplete,
    handleInlineTaskEdit,
    openTimelinePopup,
    taskWidgetRef,
  };
}

function useTaskWidgetComplete(props) {
  return useCallback(async (task) => {
    const nextCompleted = !task.completed;
    if (nextCompleted) notifyTaskCompletion(props, task);
    if (nextCompleted) props.removePendingTask(getTaskId(task));
    await updateHomepageTask(props, getTaskId(task), { completed: nextCompleted });
    if (nextCompleted && !isRoutineTask(task)) playTaskCompleteSound();
  }, [props]);
}

function notifyTaskCompletion(props, task) {
  try {
    props.showCompletionToast(getCompletionMessage(task), { isRoutine: isRoutineTask(task) });
  } catch {}
}

async function updateHomepageTask(props, taskId, patch) {
  try {
    await updateTask(taskId, patch);
    props.refetchTasks();
  } catch {
    await handleTaskUpdateFailure(props, taskId);
  }
}

async function handleTaskUpdateFailure(props, taskId) {
  const refreshed = await props.refetchTasks();
  const failed = (refreshed || []).some((task) => String(task?.id) === String(taskId) && !task.completed);
  if (failed) props.showToast("Couldn't update task.");
}

function useTaskToggle(props) {
  return useCallback(async (task, completed) => {
    if (completed) notifyTaskCompletion(props, task);
    try {
      await updateTask(task.id, { completed });
      props.refetchTasks();
    } catch {}
  }, [props]);
}

function useTimelinePopup(openPopup) {
  return useCallback((event, _matchTask, anchorRect = null) => {
    if (!event) return;
    openPopup({ ...event, forcePersonalPopup: true, timelineReadOnly: true }, anchorRect, false, "day");
  }, [openPopup]);
}

function useDeleteTaskAndRefresh(refetchTasks) {
  return useCallback(async (task) => {
    await deleteTask(task.id);
    refetchTasks();
  }, [refetchTasks]);
}

function useInlineTaskEdit(refetchTasks) {
  return useCallback(async (task, patch) => {
    await updateTask(task.id, patch);
    refetchTasks();
  }, [refetchTasks]);
}
