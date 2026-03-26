/*
 * Create-task-bar quick-add helpers.
 */

export const POMODORO_BLOCK_MINUTES = 25;
export const MIN_ESTIMATE_MINUTES = 5;
export const MAX_ESTIMATE_MINUTES = 240;

export function clampEstimateMinutes(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return POMODORO_BLOCK_MINUTES;
  return Math.min(MAX_ESTIMATE_MINUTES, Math.max(MIN_ESTIMATE_MINUTES, numeric));
}

export function normalizeEstimateMinutesInput(value, fallback) {
  if (value === "" || value === null || typeof value === "undefined") {
    return clampEstimateMinutes(fallback ?? POMODORO_BLOCK_MINUTES);
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return clampEstimateMinutes(fallback ?? POMODORO_BLOCK_MINUTES);
  }
  return clampEstimateMinutes(numeric);
}

export function minutesToEstimateBlocks(minutes) {
  return Math.max(1, Math.ceil(clampEstimateMinutes(minutes) / POMODORO_BLOCK_MINUTES));
}

export function getEstimateBlocks(pageCount) {
  return Math.max(1, Math.ceil((Number(pageCount) * 2) / POMODORO_BLOCK_MINUTES));
}

export function buildQuickAddPayload(state, taskTitle) {
  const { sortedLists, taskListId, estimatedMinutes, moduleId, defaultDueDate, pageCount } = state;
  const estimatedBlocks = pageCount ? getEstimateBlocks(pageCount) : minutesToEstimateBlocks(estimatedMinutes ?? POMODORO_BLOCK_MINUTES);
  return {
    title: taskTitle,
    description: "",
    priority: "medium",
    due_date: defaultDueDate ?? null,
    task_list: taskListId ? Number(taskListId) : null,
    estimated_blocks: estimatedBlocks,
    module: moduleId ? Number(moduleId) : null,
    page_count: pageCount ? Number(pageCount) : null,
  };
}

function resetQuickAddForm(state) {
  state.setTitle("");
  state.setModuleId(null);
  if (typeof state.setPageCount === "function") state.setPageCount(null);
}

function setQuickAddSaving(state, value) {
  if (typeof state.setSaving === "function") state.setSaving(value);
}

export async function runQuickAdd(state, onAddTask, taskTitle) {
  if (state.saving || !onAddTask) return;
  setQuickAddSaving(state, true);
  try {
    await onAddTask(buildQuickAddPayload(state, taskTitle));
    resetQuickAddForm(state);
  } finally {
    setQuickAddSaving(state, false);
  }
}
