export { formatTime } from "./dateFormatUtils";

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

export function getNavigatorContext(sortedEvents, now) {
  const list = Array.isArray(sortedEvents) ? sortedEvents : [];
  const current = list.find((e) => isNow(e.start_time, e.end_time, now));
  const next = list.find((e) => new Date(e.start_time).getTime() > now.getTime());
  return { current, next };
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
