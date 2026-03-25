/*
 * Shared task sort options used across task views (Tasks page, timer picker, etc.).
 */

export const TASK_SORT_OPTIONS = [
  { value: "priority",        label: "Priority" },
  { value: "due",             label: "Due date" },
  { value: "alpha",           label: "A \u2192 Z" },
  { value: "alpha-desc",      label: "Z \u2192 A" },
  { value: "date_added",      label: "Date created (newest)" },
  { value: "date_added_asc",  label: "Date created (oldest)" },
  { value: "est_time",        label: "Estimated time" },
];
