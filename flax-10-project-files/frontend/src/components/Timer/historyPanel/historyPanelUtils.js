/*
 * Helpers for the timer history rail.
 */

function startOfDay(dateLike) {
  const date = new Date(dateLike);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getHistoryHorizonLabel(dateValue, now = new Date()) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Earlier';
  const today = startOfDay(now);
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return target >= getWeekStart(today) ? 'This Week' : 'Earlier';
}

function getWeekStart(today) {
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  return weekStart;
}

export function getSevenDayFocusSeries(blocks, now = new Date()) {
  const days = createSevenDaySeries(now);
  const dayMap = new Map(days.map((item) => [item.key, item]));
  blocks.forEach((block) => addBlockToSeries(block, dayMap));
  return days;
}

function createSevenDaySeries(now) {
  return Array.from({ length: 7 }).map((_, index) => buildSeriesDay(now, 6 - index));
}

function buildSeriesDay(now, daysBack) {
  const date = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack));
  return { key: date.toISOString().slice(0, 10), label: date.toLocaleDateString(undefined, { weekday: 'short' }), seconds: 0 };
}

function addBlockToSeries(block, dayMap) {
  const date = new Date(block.startTime || block.endTime || Date.now());
  if (Number.isNaN(date.getTime())) return;
  const bucket = dayMap.get(startOfDay(date).toISOString().slice(0, 10));
  if (bucket) bucket.seconds += Number(block.totalDuration || 0);
}

export function getModuleLabel(block) {
  if (block.module) return block.module;
  const session = Array.isArray(block.sessions) ? block.sessions.find((item) => item?.module || item?.module_code || item?.moduleCode || item?.list) : null;
  return session?.module || session?.module_code || session?.moduleCode || session?.list || null;
}

export function filterVisibleBlocks(blocks) {
  return blocks.filter((block) => isVisibleBlock(block));
}

function isVisibleBlock(block) {
  const seconds = Number(block.totalDuration || 0);
  const completed = Array.isArray(block.sessions) ? block.sessions.filter((session) => session?.status !== 'Incomplete').length : 0;
  return seconds >= 300 || completed > 0;
}

export function groupBlocksByHorizon(blocks) {
  const labels = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  const grouped = new Map(labels.map((label) => [label, []]));
  blocks.slice(0, 24).forEach((block) => grouped.get(getHistoryHorizonLabel(block.startTime)).push(block));
  return labels.map((label) => ({ label, entries: grouped.get(label) })).filter((group) => group.entries.length > 0);
}
