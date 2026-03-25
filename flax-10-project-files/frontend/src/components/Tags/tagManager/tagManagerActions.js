/*
 * Async action helpers for tag manager mutations.
 */

import { findDuplicateTag } from "./tagManagerUtils";

export async function saveTag({
  addTag,
  confirm,
  data,
  editingId,
  resetState,
  tags,
  updateTag,
}) {
  const duplicate = findDuplicateTag(tags, data.label);

  if (duplicate && duplicate.id !== editingId) {
    return handleDuplicateTag({ confirm, data, duplicate, resetState, updateTag });
  }

  return commitTag({ addTag, data, editingId, resetState, updateTag });
}

async function handleDuplicateTag({ confirm, data, duplicate, resetState, updateTag }) {
  const shouldReplace = await confirm(getDuplicatePrompt());
  if (!shouldReplace) return false;
  await updateTag(duplicate.id, data);
  resetState();
  return true;
}

function getDuplicatePrompt() {
  return {
    title: "Duplicate Tag Name",
    message: "A tag with this name already exists. What would you like to do?",
    confirmText: "Replace Existing",
    cancelText: "Cancel",
    isDanger: true,
  };
}

async function commitTag({ addTag, data, editingId, resetState, updateTag }) {
  const action = editingId ? updateTag(editingId, data) : addTag(data);
  await action;
  resetState();
  return true;
}

export async function deleteTagWithConfirmation({
  confirm,
  deleteTag,
  id,
  tags,
  toast,
}) {
  const tag = tags.find((currentTag) => currentTag.id === id);
  const shouldDelete = await confirm(getDeletePrompt(tag?.label));
  if (!shouldDelete) return false;
  return finalizeDelete({ deleteTag, id, tagLabel: tag?.label, toast });
}

function getDeletePrompt(label) {
  return {
    title: "Delete Tag",
    message: `Are you sure you want to delete "${label}"?`,
    confirmText: "Delete",
    cancelText: "Cancel",
    isDanger: true,
  };
}

async function finalizeDelete({ deleteTag, id, tagLabel, toast }) {
  const deleted = await deleteTag(id);
  if (deleted === false) return showDeleteError(toast);
  toast?.(`"${tagLabel || "Tag"}" deleted.`);
  return true;
}

function showDeleteError(toast) {
  toast?.("Couldn't delete tag.", { variant: "error" });
  return false;
}
