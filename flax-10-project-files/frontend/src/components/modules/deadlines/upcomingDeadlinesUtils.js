<<<<<<< HEAD
export {
  DEADLINE_TIER_ORDER,
  PRIORITY_PILL,
  TIER_ACCENT,
  getDayCount,
  getDaysLabel,
  getDueStatusClass,
  getTierPriority,
  getUrgencyTier,
  isUrgentTier,
} from "../../common/deadline_countdown/deadlineCountdownUtils";
=======
/*
 * Helpers for counting days until deadline and formatting labels.
 */
export function getDayCount(dueDate) {
  const ms = new Date(dueDate).getTime() - Date.now();
  return Math.floor(ms / 86400000);
}

export function getUrgencyTier(dueDate) {
  const days = getDayCount(dueDate);
  if (days < 0) return 'overdue';
  if (days <= 2) return 'critical';
  if (days <= 5) return 'urgent';
  if (days <= 14) return 'upcoming';
  return 'distant';
}

export function getDaysLabel(dueDate) {
  const days = getDayCount(dueDate);
  if (days < 0) {
    const over = Math.abs(days);
    return over === 0 ? 'Overdue' : over === 1 ? '1d overdue' : `${over}d overdue`;
  }
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
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
  overdue: { label: 'Overdue', marks: '!!', cls: 'priorityPill_overdue' },
  critical: { label: 'Urgent', marks: '!!!', cls: 'priorityPill_critical' },
  urgent: null,
  upcoming: null,
  distant: null,
};

export function getDueStatusClass(tier) {
  if (tier === 'overdue') return 'due_overdue';
  if (tier === 'critical') return 'due_today';
  if (tier === 'urgent') return 'due_tomorrow';
  return 'due_future';
}

export const TIER_ACCENT = {
  overdue: 'var(--home-urgency-danger)',
  critical: 'var(--home-urgency-warning)',
  urgent: 'var(--home-urgency-warning)',
  upcoming: 'var(--home-urgency-neutral)',
  distant: 'var(--home-urgency-neutral-border)',
};
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
