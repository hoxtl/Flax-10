/*
 * Create-task-bar quick-add helpers.
 */

export function getEstimateBlocks(pageCount) {
  return Math.max(1, Math.ceil((Number(pageCount) * 2) / 25));
}

export function buildQuickAddPayload(state, taskTitle) {
  const { sortedLists, taskListId, estimatedBlocks, moduleId, defaultDueDate, pageCount } = state;
  return {
    title: taskTitle,
    description: "",
    priority: "medium",
    due_date: defaultDueDate ?? null,
    task_list: taskListId ? Number(taskListId) : (sortedLists[0]?.id ?? null),
    estimated_blocks: pageCount ? getEstimateBlocks(pageCount) : estimatedBlocks,
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
