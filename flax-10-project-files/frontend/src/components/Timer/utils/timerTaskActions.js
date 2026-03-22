/*
 * Timer task action helpers.
 */

import { rankTasksForFocus } from '../../../lib/focusPlanner';
import { applyTaskToTimer } from './presetUtils';

function buildManualTaskMeta(t) {
  return {
    title: t.task.trim(),
    moduleCode: t.activeTaskMeta?.moduleCode || null,
    dueDate: t.activeTaskMeta?.dueDate || null,
    listName: t.activeTaskMeta?.listName || 'Quick task',
    estimatedBlocks: Number(t.activeTaskMeta?.estimatedBlocks || 1),
    estimatedSessionCount: Number(t.targetSessions || 1),
    estimatedWorkMinutes: Number(t.workTime || 25),
  };
}

export function clearManualTask(t) {
  if (typeof t.setActiveTaskId !== 'function') return;
  t.setActiveTaskId(null);
}

export function startManualTask(t) {
  const title = (t.task || '').trim();
  if (!title) return t.setIsActive(true);
  if (t.setActiveTaskId) t.setActiveTaskId(null, buildManualTaskMeta(t));
  return t.setIsActive(true);
}

async function loadOpenTasks() {
  const { fetchTasks } = await import('../../../api/tasks/taskApi');
  const tasks = await fetchTasks({ completed: false });
  return Array.isArray(tasks) ? tasks.filter((task) => !task.completed && !task.archived) : [];
}

async function loadSuggestedTask() {
  const ranked = rankTasksForFocus(await loadOpenTasks());
  return ranked[0] || null;
}

async function tryLoadSuggestedTask() {
  try {
    return await loadSuggestedTask();
  } catch {
    return null;
  }
}

export async function startSuggestedTask(t) {
  const title = (t.task || '').trim();
  if (title) return t.setIsActive(true);
  const task = await tryLoadSuggestedTask();
  if (!task) return t.setIsActive(true);
  return applyTaskToTimer(task, t);
}
