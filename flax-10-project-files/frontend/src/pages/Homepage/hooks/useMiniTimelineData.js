/* Derived data for the homepage mini timeline. */

import { useMemo } from "react";
import { isToday } from "../../../components/Calendar/utils/dateUtils";
import { DAY_END_HOUR, DAY_START_HOUR } from "../utils/timelineUtils";
import { computePlanTimelineRows } from "../utils/planTimelineRows";
import { isNow } from "../utils/eventUtils";
import { deriveAssignedGapTasks, deriveBestFreeRowId, deriveGapDeadlineFallbacks } from "./miniTimeline/assignmentUtils";

function getDayBounds(selectedDate) {
  const start = new Date(selectedDate);
  const end = new Date(selectedDate);
  start.setHours(DAY_START_HOUR, 0, 0, 0);
  end.setHours(DAY_END_HOUR, 0, 0, 0);
  return { start, end };
}

function getCurrentBlock(sortedEvents, selectedDate, hasTimerSession) {
  if (hasTimerSession || !isToday(selectedDate)) return null;
  return (sortedEvents || []).find((ev) => ev.start_time && ev.end_time && isNow(ev.start_time, ev.end_time)) || null;
}

function useDerivedTimelineData(rows, props) {
  const { suggestableTasks, now, skippedGapTasks, slottedTaskIds, slottedTitles, deadlineSuggestions } = props;
  const bestFreeRowId = useMemo(() => deriveBestFreeRowId(rows, suggestableTasks, now), [now, rows, suggestableTasks]);
  const assignedGapTasks = useMemo(
    () => deriveAssignedGapTasks(rows, suggestableTasks, now, skippedGapTasks, slottedTaskIds, slottedTitles),
    [now, rows, skippedGapTasks, slottedTaskIds, slottedTitles, suggestableTasks],
  );
  const gapDeadlineFallbacks = useMemo(
    () => deriveGapDeadlineFallbacks(rows, assignedGapTasks, deadlineSuggestions, slottedTitles),
    [assignedGapTasks, deadlineSuggestions, rows, slottedTitles],
  );
  return { bestFreeRowId, assignedGapTasks, gapDeadlineFallbacks };
}

export function useMiniTimelineData(props) {
  const { sortedEvents, selectedDate, now, dayTasks, tasksDueToday, hasTimerSession } = props;
  const bounds = useMemo(() => getDayBounds(selectedDate), [selectedDate]);
  const rows = useMemo(
    () => computePlanTimelineRows(sortedEvents, selectedDate, bounds.start, bounds.end, now, dayTasks, tasksDueToday, isToday),
    [bounds.end, bounds.start, dayTasks, now, selectedDate, sortedEvents, tasksDueToday],
  );
  const derived = useDerivedTimelineData(rows, props);
  const currentBlock = useMemo(() => getCurrentBlock(sortedEvents, selectedDate, hasTimerSession), [hasTimerSession, selectedDate, sortedEvents]);
  return { rows, ...derived, currentBlock };
}
