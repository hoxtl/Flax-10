import { useMemo } from "react";
import { isToday } from "../../../components/Calendar/utils/dateUtils";
import { DAY_START_HOUR, DAY_END_HOUR } from "../utils/timelineUtils";
import { computePlanTimelineRows } from "../utils/planTimelineRows";
import { getTasksThatFitGap, taskDurationMins } from "../utils/taskUtils";
import { isNow } from "../utils/eventUtils";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

export function useMiniTimelineData({ sortedEvents, selectedDate, now, dayTasks, tasksDueToday, suggestableTasks, hasTimerSession }) {
  const bounds = useMemo(() => {
    const s = new Date(selectedDate); s.setHours(DAY_START_HOUR, 0, 0, 0);
    const e = new Date(selectedDate); e.setHours(DAY_END_HOUR, 0, 0, 0);
    return { start: s, end: e };
  }, [selectedDate]);

  const rows = useMemo(() => 
    computePlanTimelineRows(sortedEvents, selectedDate, bounds.start, bounds.end, now, dayTasks, tasksDueToday, isToday),
    [sortedEvents, selectedDate, bounds, now, dayTasks, tasksDueToday]
  );

  const bestFreeRowId = useMemo(() => deriveBestFreeRow(rows, suggestableTasks, now), [rows, suggestableTasks, now]);
  const assignedGapTasks = useMemo(() => deriveAssignedTasks(rows, suggestableTasks, now), [rows, suggestableTasks, now]);

  const currentBlock = useMemo(() => 
    (!hasTimerSession && isToday(selectedDate)) ? (sortedEvents || []).find(e => e.start_time && e.end_time && isNow(e.start_time, e.end_time)) : null,
    [hasTimerSession, selectedDate, sortedEvents]
  );

  return { rows, bestFreeRowId, assignedGapTasks, currentBlock };
}

function deriveBestFreeRow(rows, tasks, now) {
  let best = null, bestScore = -1;
  rows.filter(r => r.type === "free").forEach(r => {
    const { suggested } = getTasksThatFitGap(tasks || [], r.minutes || 0);
    const score = (r.minutes || 0) + (suggested?.priority === "urgent" ? 140 : suggested?.priority === "high" ? 70 : 0);
    if (score > bestScore) { bestScore = score; best = r.id; }
  });
  return best;
}

function deriveAssignedTasks(rows, tasks, now) {
  const freeRows = rows.filter(r => r.type === "free").sort((a, b) => (a.gapStartMins ?? 0) - (b.gapStartMins ?? 0));
  const queue = [...(tasks || [])].filter(t => !t?.completed).sort((a, b) => {
    const aDue = a?.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bDue = b?.due_date ? new Date(b.due_date).getTime() : Infinity;
    return (aDue !== bDue) ? aDue - bDue : (PRIORITY_ORDER[a?.priority] ?? 2) - (PRIORITY_ORDER[b?.priority] ?? 2);
  });

  const used = new Set(), map = {};
  freeRows.forEach(row => {
    const pick = queue.find(t => !used.has(t.id) && getTasksThatFitGap([t], row.minutes || 0).suggested);
    if (pick) { map[row.id] = pick; used.add(pick.id); }
  });
  return map;
}
