/*
 * Shared helpers for tag manager flow.
 */

import { DEFAULT_TAG_FORM, PROTECTED_TAGS } from "./constants";

export function isProtectedTag(tagLabel) {
  return PROTECTED_TAGS.includes(tagLabel?.toLowerCase());
}

export function getInitialTagForm(tags, editingId) {
  return tags.find((tag) => tag.id === editingId) || DEFAULT_TAG_FORM;
}

export function findDuplicateTag(tags, label) {
  return tags.find((tag) => tag.label.toLowerCase() === label.toLowerCase());
}

export function validateTagForm(form, isProtected) {
  if (!isProtected && !form.label.trim()) return "Name is required.";
  return "";
}
