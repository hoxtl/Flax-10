/**
 * Helpers for CreateTaskBar quick-add payload and save.
 */

export function getEstimateBlocks(pageCount) {
  return Math.max(1, Math.ceil((Number(pageCount) * 2) / 25));
}

export function buildQuickAddPayload(state, taskTitle) {
  const { sortedLists, taskListId, estimatedBlocks, moduleId, defaultDueDate , pageCount} = state;
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

export async function runQuickAdd(state, onAddTask, taskTitle) {
  if (state.saving || !onAddTask) return;
  if (typeof state.setSaving === 'function') state.setSaving(true);
  try {
    await onAddTask(buildQuickAddPayload(state, taskTitle));
    state.setTitle("");
    state.setModuleId(null);
    state.setPageCount(null);
  } finally {
    if (typeof state.setSaving === 'function') state.setSaving(false);
  }
}
