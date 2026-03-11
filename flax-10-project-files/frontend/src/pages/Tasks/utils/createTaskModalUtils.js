import { getEstimateBlocks } from "./createTaskBarUtils";

/**
 * Builds the API payload for create/edit task from form state.
 */

/** Builds the payload object for the task API from form fields. */

export function buildCreateTaskPayload(form) {
  const blocks = form.page_count ? getEstimateBlocks(form.page_count) : Math.max(1, Number(form.estimated_blocks) || 1);
  return {
    title: form.title.trim(),
    description: form.description || "",
    priority: form.priority || "medium",
    due_date: form.due_date,
    task_list: form.task_list ? Number(form.task_list) : null,
    estimated_blocks: blocks,
    module: form.module ? Number(form.module) : null,
    page_count: form.page_count ? Number(form.page_count) : null,
  };
}

/** Runs save: builds payload, calls onSave, then onClose. Catches and sets error. */
export async function runCreateTaskSave(form, addToSchedule, mode, showAddToScheduleToggle, onSave, onClose, setSaveError) {
  setSaveError("");
  const payload = buildCreateTaskPayload(form);
  const meta = mode === "create" && showAddToScheduleToggle ? { addToSchedule } : undefined;
  try {
    await (meta ? onSave(payload, meta) : onSave(payload));
    onClose();
  } catch (err) {
    setSaveError(err?.message || "Couldn't save task. Please try again.");
  }
}
