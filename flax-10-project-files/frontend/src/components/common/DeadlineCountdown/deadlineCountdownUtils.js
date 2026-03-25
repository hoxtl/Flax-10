/*
 * Shared deadline urgency helpers used across modules and group projects.
 */

export function getDayCount(dueDate) {
  const ms = new Date(dueDate).getTime() - Date.now();
  return Math.floor(ms / 86400000);
}

export function getUrgencyTier(dueDate) {
  const days = getDayCount(dueDate);
  if (days < 0) return "overdue";
  if (days <= 2) return "critical";
  if (days <= 5) return "urgent";
  if (days <= 14) return "upcoming";
  return "distant";
}

export function getDaysLabel(dueDate) {
  const days = getDayCount(dueDate);
  if (days < 0) {
    const over = Math.abs(days);
    return over === 1 ? "1d overdue" : `${over}d overdue`;
  }
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d`;
}

export const DEADLINE_TIER_ORDER = {
  overdue: 0,
  critical: 1,
  urgent: 2,
  upcoming: 3,
  distant: 4,
};

export const PRIORITY_PILL = {
  overdue: { label: "Overdue", marks: "!!", cls: "priorityPillOverdue" },
  critical: { label: "Urgent", marks: "!!!", cls: "priorityPillCritical" },
  urgent: null,
  upcoming: null,
  distant: null,
};

export function getDueStatusClass(tier) {
  if (tier === "overdue") return "dueOverdue";
  if (tier === "critical") return "dueToday";
  if (tier === "urgent") return "dueTomorrow";
  return "dueFuture";
}

export function isUrgentTier(tier) {
  return tier === "overdue" || tier === "critical" || tier === "urgent";
}

export function getTierPriority(tier) {
  if (tier === "overdue" || tier === "critical") return "urgent";
  if (tier === "urgent") return "high";
  return "medium";
}

export const TIER_ACCENT = {
  overdue: "var(--home-urgency-danger)",
  critical: "var(--home-urgency-warning)",
  urgent: "var(--home-urgency-warning)",
  upcoming: "var(--home-urgency-neutral)",
  distant: "var(--home-urgency-neutral-border)",
};
