/*
 * Auto-schedule form builder for Homepage deadline planning.
 */

const MINUTES_BY_URGENCY = {
  overdue: 90,
  critical: 75,
  urgent: 60,
  upcoming: 45,
  distant: 30,
};

function getUrgencyTier(dueDate) {
  const dueTime = new Date(dueDate).getTime();
  if (!Number.isFinite(dueTime)) return null;
  const days = Math.floor((dueTime - Date.now()) / 86400000);
  if (days < 0) return 'overdue';
  if (days <= 2) return 'critical';
  if (days <= 5) return 'urgent';
  if (days <= 14) return 'upcoming';
  return 'distant';
}

export function buildScheduleAutoForm({ deadlines = [] } = {}) {
  if (!Array.isArray(deadlines) || deadlines.length === 0) return null;
  const prefs = getDeadlinePreferences(deadlines);
  if (!prefs.length) return null;
  return {
    title: `Homepage auto schedule ${new Date().toLocaleDateString('en-GB')}`,
    clear_existing: false,
    deadline_preferences: prefs,
  };
}

export { getUrgencyTier };

function getDeadlinePreferences(deadlines) {
  return deadlines.filter(isSchedulableDeadline).sort(compareByDueDate).map(buildDeadlinePreference);
}

function isSchedulableDeadline(deadline) {
  return Boolean(deadline && deadline.id != null && deadline.start_due_date && new Date(deadline.start_due_date).getTime() >= Date.now());
}

function compareByDueDate(left, right) {
  return new Date(left.start_due_date) - new Date(right.start_due_date);
}

function buildDeadlinePreference(deadline) {
  const tier = getUrgencyTier(deadline.start_due_date) || 'upcoming';
  return {
    deadline_id: Number(deadline.id),
    ideal_minutes_per_day: MINUTES_BY_URGENCY[tier] || 45,
  };
}
