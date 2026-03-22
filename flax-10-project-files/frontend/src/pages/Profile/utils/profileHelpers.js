/*
 * Profile utility helpers – event filtering, date ranges, and name formatting.
 */
import { getInitials } from "../../../components/Authentication/utils/userUtils";

export const RANGE_OPTIONS = [
  ['today', 'Today'],
  ['week', 'This Week'],
  ['month', 'This Month'],
];

export const DATE_FORMAT = { day: 'numeric', month: 'short', year: 'numeric' };
export const TIME_FORMAT = { hour: '2-digit', minute: '2-digit' };

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function dateOffset(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function isInRange(eventStart, today, range) {
  if (range === 'today') return eventStart >= today && eventStart < dateOffset(today, 1);
  if (range === 'week') return eventStart >= today && eventStart < dateOffset(today, 7);
  return eventStart >= today && eventStart < dateOffset(today, 30);
}

export function getFilteredEvents(allEvents, eventRange, baseDate) {
  const today = baseDate ? new Date(baseDate) : getToday();
  return (allEvents || [])
    .filter(e => isInRange(new Date(e.start_time), today, eventRange))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

export function getUpcomingCount(allEvents) {
  const today = getToday();
  return allEvents.filter(e => isInRange(new Date(e.start_time), today, 'month')).length;
}

export function getRangeLabel(range) {
  const found = RANGE_OPTIONS.find(([key]) => key === range);
  return found ? found[1] : range;
}

export function buildInitials(user) {
  if (user?.name) return getInitials(user.name);
  if (user?.first_name && user?.last_name) return `${user.first_name[0]}${user.last_name[0]}`;
  return "?";
}

export function buildFullName(user) {
  return user?.name
    || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
    || "Guest";
}