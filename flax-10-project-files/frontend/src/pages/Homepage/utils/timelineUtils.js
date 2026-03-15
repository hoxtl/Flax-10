/**
 * Homepage timeline helpers. Pure functions only.
 */

import { isLecture } from "./eventUtils";
import { formatTimeHHMM } from "./dateFormatUtils";

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
export const PX_PER_HOUR = 80;
export const PX_PER_MIN = PX_PER_HOUR / 60;
/** Gaps below this get a thin line; 30+ get the full ghost "Gap Card". */
export const GAP_CARD_THRESHOLD_MINS = 30;
/** Vertical px between rows for compact list-style timeline. */
export const FIXED_ROW_GAP_PX = 4;

export const MINI_TIMELINE_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * PX_PER_HOUR;

/** Percent of "day budget" passed (6am–11pm). 0–100 for Daily Energy bar. */
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

/** Percent through the event (0–100) for the current time; null if not active. */
export function getNowLinePercent(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const now = new Date();
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (now < start || now > end) return null;
  const p = ((now - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, p));
}

/** Compute top-3 peak hours from 7×24 heatmap matrix. */
export function getPeakHours(heatmap) {
  if (!heatmap?.data || !Array.isArray(heatmap.data)) return [];
  const hourTotals = Array(24).fill(0);
  for (const dayRow of heatmap.data) {
    for (let h = 0; h < dayRow.length; h++) {
      hourTotals[h] += dayRow[h] || 0;
    }
  }
  return hourTotals
    .map((total, hour) => ({ hour, total }))
    .filter((h) => h.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);
}

/** Returns "urgent" if deadlines within 3 days and low focus today, else "normal". */
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

/** Compute daily narrative: day type, session count, best window for deep work. */
export function getDailyNarrative(selectedDate, sortedEvents) {
  const dayStart = new Date(selectedDate);
  dayStart.setHours(8, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(22, 0, 0, 0);
  const lectureCount = (sortedEvents || []).filter(isLecture).length;
  const sessionCount = (sortedEvents || []).length;
  const dayType =
    lectureCount >= 3 ? "Lecture Heavy" : lectureCount >= 1 ? "Moderate" : sessionCount > 0 ? "Busy" : "Free";

  let bestWindowStart = null;
  let bestWindowEnd = null;
  let bestMinutes = 0;

  const events = [...(sortedEvents || [])].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayEnd.getTime();

  if (events.length === 0) {
    bestWindowStart = dayStart;
    bestWindowEnd = dayEnd;
    bestMinutes = (dayEndMs - dayStartMs) / 60000;
  } else {
    const firstStart = new Date(events[0].start_time).getTime();
    if (firstStart > dayStartMs) {
      const mins = (firstStart - dayStartMs) / 60000;
      if (mins >= 60 && mins > bestMinutes) {
        bestMinutes = mins;
        bestWindowStart = new Date(dayStartMs);
        bestWindowEnd = new Date(firstStart);
      }
    }
    for (let i = 0; i < events.length - 1; i++) {
      const end1 = new Date(events[i].end_time || events[i].start_time).getTime();
      const start2 = new Date(events[i + 1].start_time).getTime();
      const gapMins = (start2 - end1) / 60000;
      if (gapMins >= 60 && gapMins > bestMinutes) {
        bestMinutes = gapMins;
        bestWindowStart = new Date(end1);
        bestWindowEnd = new Date(start2);
      }
    }
    const lastEnd = new Date(events[events.length - 1].end_time || events[events.length - 1].start_time).getTime();
    if (dayEndMs > lastEnd) {
      const mins = (dayEndMs - lastEnd) / 60000;
      if (mins >= 60 && mins > bestMinutes) {
        bestMinutes = mins;
        bestWindowStart = new Date(lastEnd);
        bestWindowEnd = new Date(dayEndMs);
      }
    }
  }

  return {
    dayType,
    sessionCount,
    lectureCount,
    bestWindowStart: bestWindowStart ? formatTimeHHMM(bestWindowStart) : null,
    bestWindowEnd: bestWindowEnd ? formatTimeHHMM(bestWindowEnd) : null,
  };
}

/** Group overlapping events into clusters, then interleave gaps. */
export function groupOverlaps(sortedItems) {
  const groups = [];
  let current = [];
  let clusterEnd = null;

  for (const item of sortedItems) {
    const start = new Date(item.start_time);
    const end = new Date(item.end_time || item.start_time);
    if (current.length === 0 || start < clusterEnd) {
      current.push(item);
      if (!clusterEnd || end > clusterEnd) clusterEnd = end;
    } else {
      groups.push(current.length === 1 ? { type: "single", item: current[0] } : { type: "cluster", items: current });
      current = [item];
      clusterEnd = end;
    }
  }
  if (current.length > 0) {
    groups.push(current.length === 1 ? { type: "single", item: current[0] } : { type: "cluster", items: current });
  }
  return groups;
}

export function computeTimelineWithGaps(sortedItems, pendingTasks) {
  const grouped = groupOverlaps(sortedItems);
  const result = [];

  for (let i = 0; i < grouped.length; i++) {
    const g = grouped[i];
    result.push(g.type === "cluster" ? { type: "cluster", items: g.items } : { type: "item", data: g.item });

    if (i < grouped.length - 1) {
      const lastItem = g.type === "cluster" ? g.items[g.items.length - 1] : g.item;
      const curEnd = new Date(lastItem.end_time || lastItem.start_time);
      const nextGroup = grouped[i + 1];
      const firstNext = nextGroup.type === "cluster" ? nextGroup.items[0] : nextGroup.item;
      const nextStart = new Date(firstNext.start_time);
      const gapMins = Math.round((nextStart - curEnd) / 60000);
      if (gapMins >= 30) {
        const fits = (t) => ((t.estimated_blocks || 1) * 25) <= gapMins;
        const suggestedTask = pendingTasks.find(fits) || pendingTasks[0] || null;
        const isQuickWin = gapMins >= 30 && gapMins < 60;
        result.push({ type: "gap", minutes: gapMins, gapStart: curEnd, suggestedTask, isQuickWin });
      }
    }
  }
  return result;
}

/** Smart gap label and variant by time of day. */
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

/** Date at gapStartMins from day start (for plan timeline). */
export function getGapStartDate(selectedDate, gapStartMins, dayStartHour = DAY_START_HOUR) {
  const d = new Date(selectedDate);
  d.setHours(dayStartHour, 0, 0, 0);
  d.setMinutes(d.getMinutes() + gapStartMins);
  return d;
}
