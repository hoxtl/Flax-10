export { formatTime } from "./dateFormatUtils";
import { overlapsDay } from "../../../components/Calendar/utils/dateUtils";

export function isNow(startTime, endTime, now = new Date()) {
  const t = now.getTime();
  const s = new Date(startTime).getTime();
  const e = new Date(endTime).getTime();
  return t >= s && t < e;
}

export function isLecture(event) {
  return event?.source === "module" || event?.module != null;
}

export function isRoutineEvent(event) {
  return !!(event?.recurrence_rule || event?.tag?.name === "Routine");
}

/**
 * Daily navigator context used by RIGHT NOW + header status strip.
 * Returns:
 * - state: "conflict" | "task" | "gap" | "beforeDay" | "endOfDay" | null
 * - currentBlock: event happening now (if any)
 * - nextItem: next upcoming event (if any)
 * - gapMins: minutes until nextItem when in a gap
 * - overlaps: array of { a, b, at } for overlapping events on the selected day
 * - conflictAt: earliest overlap time (ms)
 */
export function getNavigatorContext(now, selectedDate, events, isTodayFn) {
  const list = Array.isArray(events) ? events : [];
  const day = new Date(selectedDate);
  const isTodayFlag = typeof isTodayFn === "function" ? isTodayFn(selectedDate) : !!isTodayFn;

  const dayEvents = list.filter((e) =>
    e.start_time &&
    overlapsDay(
      new Date(e.start_time),
      new Date(e.end_time || e.start_time),
      day
    )
  );

  const withTimes = dayEvents.map((e) => {
    const start = new Date(e.start_time).getTime();
    const end = new Date(e.end_time || e.start_time).getTime() || start;
    return { ...e, _start: start, _end: end };
  });

  const nowMs = now.getTime();
  const currentBlock = withTimes.find((e) => nowMs >= e._start && nowMs < e._end) || null;
  const future = withTimes
    .filter((e) => e._start > nowMs)
    .sort((a, b) => a._start - b._start);
  const nextItem = future[0] || null;

  // Overlap detection for the day
  const overlaps = [];
  for (let i = 0; i < withTimes.length; i += 1) {
    for (let j = i + 1; j < withTimes.length; j += 1) {
      const a = withTimes[i];
      const b = withTimes[j];
      if (a._start < b._end && b._start < a._end) {
        overlaps.push({ a, b, at: Math.max(a._start, b._start) });
      }
    }
  }
  const conflictAt = overlaps.length ? Math.min(...overlaps.map((o) => o.at)) : null;

  let state = null;
  let gapMins = null;

  if (isTodayFlag) {
    if (overlaps.length) {
      state = "conflict";
    } else if (currentBlock) {
      state = "task";
    } else {
      const allDone =
        withTimes.length > 0 &&
        withTimes.every((e) => !Number.isNaN(e._end) && e._end < nowMs);
      if (allDone) {
        state = "endOfDay";
      } else if (future.length > 0) {
        const firstStart = future[0]._start;
        const morningStart = new Date(selectedDate);
        morningStart.setHours(6, 0, 0, 0);
        if (nowMs < morningStart.getTime()) {
          state = "beforeDay";
        } else {
          state = "gap";
          gapMins = Math.max(0, Math.round((firstStart - nowMs) / 60000));
        }
      }
    }
  }

  return {
    state,
    currentBlock,
    nextItem,
    gapMins,
    overlaps,
    conflictAt,
  };
}

export function getMotivationMessage() {
  return "You’ve got this.";
}

export function getPeakHours(events) {
  const list = Array.isArray(events) ? events : (events?.results && Array.isArray(events.results) ? events.results : []);
  const counts = Array(24).fill(0);
  for (const e of list) {
    const h = new Date(e.start_time).getHours();
    if (h >= 0 && h < 24) counts[h]++;
  }
  const max = Math.max(...counts);
  return counts.map((c, h) => (c === max ? h : null)).filter((h) => h != null);
}

export function getUrgencyLevel(taskOrDeadline) {
  if (!taskOrDeadline) return "low";
  const due = taskOrDeadline.due_date || taskOrDeadline.start_due_date || taskOrDeadline.due;
  if (!due) return "low";
  const ms = new Date(due).getTime() - Date.now();
  const days = ms / 86400000;
  if (days < 0) return "overdue";
  if (days < 1) return "high";
  if (days < 3) return "medium";
  return "low";
}

export function computeTimelineWithGaps(events, dayStartOrTasks, dayEnd) {
  const hasThreeArgs = dayEnd !== undefined && typeof dayStartOrTasks === "number";
  if (hasThreeArgs) {
    const dayStart = dayStartOrTasks;
    const slots = [];
    let lastEnd = dayStart;
    const sorted = [...(events || [])].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    for (const e of sorted) {
      const s = Math.max(lastEnd, new Date(e.start_time).getTime());
      const eEnd = new Date(e.end_time || e.start_time).getTime();
      if (s < eEnd) {
        if (s > lastEnd) slots.push({ type: "gap", start: lastEnd, end: s });
        slots.push({ type: "event", event: e, start: s, end: eEnd });
        lastEnd = Math.max(lastEnd, eEnd);
      }
    }
    if (lastEnd < dayEnd) slots.push({ type: "gap", start: lastEnd, end: dayEnd });
    return slots;
  }
  const tasks = dayStartOrTasks;
  const sorted = [...(events || [])].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  const slots = sorted.map((e) => ({
    type: "event",
    event: e,
    start: new Date(e.start_time).getTime(),
    end: new Date(e.end_time || e.start_time).getTime(),
  }));
  if (Array.isArray(tasks) && tasks.length > 0) {
    tasks.forEach((t) => {
      slots.push({ type: "task", task: t, start: 0, end: 0 });
    });
  }
  return slots;
}

export function getNextFreeSlotToday(events, fromTime, day) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  const slots = computeTimelineWithGaps(events, dayStart.getTime(), dayEnd.getTime());
  const gap = slots.find((s) => s.type === "gap" && s.end > fromTime.getTime());
  return gap ? { start: new Date(gap.start), end: new Date(gap.end), minutes: (gap.end - gap.start) / 60000 } : null;
}

export function getAllFreeWindowsToday(events, day) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  const slots = computeTimelineWithGaps(events, dayStart.getTime(), dayEnd.getTime());
  return slots
    .filter((s) => s.type === "gap" && (s.end - s.start) >= 20 * 60000)
    .map((s) => ({
      start: new Date(s.start),
      end: new Date(s.end),
      minutes: (s.end - s.start) / 60000,
    }));
}

export function isRoutineOrEventTask(task, getTag) {
  if (!task) return false;
  if (task.event_id) return true;
  const tag = getTag?.(task.tag_id);
  return tag?.name === "Routine" || !!task.recurrence_rule;
}

export function isAutoPassedTask(task) {
  return !!(task?.auto_passed || task?.is_auto_passed);
}
