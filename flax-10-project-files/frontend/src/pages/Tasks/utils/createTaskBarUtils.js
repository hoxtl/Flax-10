/**
 * Helpers for CreateTaskBar quick-add payload and save.
 */

export function buildQuickAddPayload(state, taskTitle) {
  const { sortedLists, taskListId, estimatedBlocks, moduleId, defaultDueDate } = state;
  return {
    title: taskTitle,
    description: "",
    priority: "medium",
    due_date: defaultDueDate ?? null,
    task_list: taskListId ? Number(taskListId) : (sortedLists[0]?.id ?? null),
    estimated_blocks: estimatedBlocks,
    module: moduleId ? Number(moduleId) : null,
  };
}

export async function runQuickAdd(state, onAddTask, taskTitle) {
  if (state.saving || !onAddTask) return;
  if (typeof state.setSaving === 'function') state.setSaving(true);
  try {
    await onAddTask(buildQuickAddPayload(state, taskTitle));
    state.setTitle("");
    state.setModuleId(null);
  } finally {
    if (typeof state.setSaving === 'function') state.setSaving(false);
  }
}
