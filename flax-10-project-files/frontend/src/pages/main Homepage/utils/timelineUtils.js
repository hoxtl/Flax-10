/* Homepage timeline helpers. Pure functions only. */

import { isLecture } from "./eventUtils";
import { formatTimeHHMM } from "./dateFormatUtils";

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
export const PX_PER_HOUR = 80;
export const PX_PER_MIN = PX_PER_HOUR / 60;
export const GAP_CARD_THRESHOLD_MINS = 30;
export const FIXED_ROW_GAP_PX = 4;
export const MINI_TIMELINE_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * PX_PER_HOUR;

export function getDailyEnergyPercent() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(6, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 0, 0, 0);
  if (now < start) return 0;
  if (now > end) return 100;
  const total = end - start;
  const elapsed = now - start;
  return Math.round((elapsed / total) * 100);
}

export function getNowLinePercent(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const now = new Date();
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (now < start || now > end) return null;
  const p = ((now - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, p));
}

function sumHourTotals(heatmap) {
  return heatmap.data.reduce((totals, dayRow) => {
    dayRow.forEach((val, h) => { totals[h] += val || 0; });
    return totals;
  }, Array(24).fill(0));
}

export function getPeakHours(heatmap) {
  if (!heatmap?.data || !Array.isArray(heatmap.data)) return [];
  const hourTotals = sumHourTotals(heatmap);
  return hourTotals
    .map((total, hour) => ({ hour, total }))
    .filter((h) => h.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);
}

export function getUrgencyLevel(deadlines, analyticsProgress) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = (analyticsProgress?.daily_progress || []).find((d) => d.date === todayStr);
  const todayActual = todayEntry?.actual_hours ?? 0;
  const critical = (deadlines || []).some((d) => {
    if (!d.start_due_date) return false;
    const daysLeft = (new Date(d.start_due_date) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft < 3;
  });
  return critical && todayActual < 2 ? "urgent" : "normal";
}

function determineDayType(lectureCount, sessionCount) {
  if (lectureCount >= 3) return "Lecture Heavy";
  if (lectureCount >= 1) return "Moderate";
  if (sessionCount > 0) return "Busy";
  return "Free";
}

function checkGap(gapStartMs, gapEndMs, currentBest) {
  const mins = (gapEndMs - gapStartMs) / 60000;
  if (mins < 60 || mins <= currentBest.bestMinutes) return currentBest;
  return { bestMinutes: mins, bestWindowStart: new Date(gapStartMs), bestWindowEnd: new Date(gapEndMs) };
}

function emptyDayWindow(dayStartMs, dayEndMs) {
  return { bestMinutes: (dayEndMs - dayStartMs) / 60000, bestWindowStart: new Date(dayStartMs), bestWindowEnd: new Date(dayEndMs) };
}

function getEventEndMs(event) {
  return new Date(event.end_time || event.start_time).getTime();
}

function scanBetweenGaps(events, best) {
  return events.slice(0, -1).reduce((acc, ev, i) => checkGap(getEventEndMs(ev), new Date(events[i + 1].start_time).getTime(), acc), best);
}

function findBestWindow(events, dayStartMs, dayEndMs) {
  if (events.length === 0) return emptyDayWindow(dayStartMs, dayEndMs);
  let best = { bestMinutes: 0, bestWindowStart: null, bestWindowEnd: null };
  best = checkGap(dayStartMs, new Date(events[0].start_time).getTime(), best);
  best = scanBetweenGaps(events, best);
  return checkGap(getEventEndMs(events[events.length - 1]), dayEndMs, best);
}

function narrativeDayBounds(selectedDate) {
  const dayStart = new Date(selectedDate);
  dayStart.setHours(8, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(22, 0, 0, 0);
  return { dayStart, dayEnd };
}

export function getDailyNarrative(selectedDate, sortedEvents) {
  const { dayStart, dayEnd } = narrativeDayBounds(selectedDate);
  const safe = sortedEvents || [];
  const lectureCount = safe.filter(isLecture).length;
  const events = [...safe].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const { bestWindowStart, bestWindowEnd } = findBestWindow(events, dayStart.getTime(), dayEnd.getTime());

  return {
    dayType: determineDayType(lectureCount, safe.length),
    sessionCount: safe.length,
    lectureCount,
    bestWindowStart: bestWindowStart ? formatTimeHHMM(bestWindowStart) : null,
    bestWindowEnd: bestWindowEnd ? formatTimeHHMM(bestWindowEnd) : null,
  };
}

function flushCluster(current) {
  if (current.length === 1) return { type: "single", item: current[0] };
  return { type: "cluster", items: current };
}

function getItemEnd(item) {
  return new Date(item.end_time || item.start_time);
}

function shouldMerge(item, clusterEnd) {
  return clusterEnd !== null && new Date(item.start_time) < clusterEnd;
}

function extendClusterEnd(clusterEnd, end) {
  return (!clusterEnd || end > clusterEnd) ? end : clusterEnd;
}

function mergeIntoCluster(acc, item) {
  acc.current.push(item);
  acc.clusterEnd = extendClusterEnd(acc.clusterEnd, getItemEnd(item));
  return acc;
}

function startNewCluster(acc, item) {
  acc.groups.push(flushCluster(acc.current));
  acc.current = [item];
  acc.clusterEnd = getItemEnd(item);
  return acc;
}

function overlapReducer(acc, item) {
  if (acc.current.length === 0 || shouldMerge(item, acc.clusterEnd)) return mergeIntoCluster(acc, item);
  return startNewCluster(acc, item);
}

export function groupOverlaps(sortedItems) {
  const { groups, current } = sortedItems.reduce(overlapReducer, { groups: [], current: [], clusterEnd: null });
  if (current.length > 0) groups.push(flushCluster(current));
  return groups;
}

function buildGapEntry(lastItem, nextGroup, pendingTasks) {
  const curEnd = new Date(lastItem.end_time || lastItem.start_time);
  const firstNext = nextGroup.type === "cluster" ? nextGroup.items[0] : nextGroup.item;
  const nextStart = new Date(firstNext.start_time);
  const gapMins = Math.round((nextStart - curEnd) / 60000);
  if (gapMins < 30) return null;

  const fits = (t) => ((t.estimated_blocks || 1) * 25) <= gapMins;
  const suggestedTask = pendingTasks.find(fits) || pendingTasks[0] || null;
  const isQuickWin = gapMins >= 30 && gapMins < 60;
  return { type: "gap", minutes: gapMins, gapStart: curEnd, suggestedTask, isQuickWin };
}

function groupToEntry(g) {
  return g.type === "cluster" ? { type: "cluster", items: g.items } : { type: "item", data: g.item };
}

function getLastItem(g) {
  return g.type === "cluster" ? g.items[g.items.length - 1] : g.item;
}

function interleaveGaps(grouped, pendingTasks) {
  return grouped.slice(0, -1).flatMap((g, i) => {
    const gap = buildGapEntry(getLastItem(g), grouped[i + 1], pendingTasks);
    return gap ? [groupToEntry(g), gap] : [groupToEntry(g)];
  });
}

export function computeTimelineWithGaps(sortedItems, pendingTasks) {
  const grouped = groupOverlaps(sortedItems);
  if (grouped.length === 0) return [];
  const body = interleaveGaps(grouped, pendingTasks);
  return [...body, groupToEntry(grouped[grouped.length - 1])];
}

export function getSmartWindowLabel(gapStartDate) {
  const d = gapStartDate instanceof Date ? gapStartDate : new Date(gapStartDate);
  const hour = d.getHours() + d.getMinutes() / 60;
  if (hour >= 8 && hour < 11) return { label: "Morning Momentum: Prime for Deep Work. ⚡", variant: "morning" };
  if (hour >= 11 && hour < 15) return { label: "Mid-day Peak: Tackle your big goals. 🏔️", variant: "midday" };
  if (hour >= 17 && hour < 24) return { label: "Evening Calm: Reset and reflect. 🌙", variant: "evening" };
  if (hour >= 5 && hour < 8) return { label: "Early Window: Use intentionally. ⚡", variant: "default" };
  return { label: "Focus Window: Use this time intentionally. ⚡", variant: "default" };
}

export function minsFromDayStart(d, dayStartHour = DAY_START_HOUR) {
  const date = d instanceof Date ? d : new Date(d);
  return date.getHours() * 60 + date.getMinutes() - dayStartHour * 60;
}

export function getGapStartDate(selectedDate, gapStartMins, dayStartHour = DAY_START_HOUR) {
  const d = new Date(selectedDate);
  d.setHours(dayStartHour, 0, 0, 0);
  d.setMinutes(d.getMinutes() + gapStartMins);
  return d;
}
