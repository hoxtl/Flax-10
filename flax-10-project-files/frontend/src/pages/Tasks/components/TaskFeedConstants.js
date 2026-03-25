/*
 * Shared constants and inline styles for the task feed surface.
 */

export const SECTION_SHOW_LIMIT = 8;

export const MOBILE_VIEW_OPTIONS = [
  { value: "all", label: "All tasks" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "later", label: "Later" },
  { value: "overdue", label: "Overdue" },
];

export const taskFeedHintStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  background: "var(--hover-light)",
  border: "1px solid var(--border)",
  borderRadius: 999,
  padding: "3px 10px",
  marginTop: 4,
};
