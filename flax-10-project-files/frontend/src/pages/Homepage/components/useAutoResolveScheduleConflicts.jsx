import { useEffect, useMemo, useRef } from "react";
import { overlapsDay } from "../../../components/Calendar/utils/dateUtils";
import { DAY_START_HOUR, DAY_END_HOUR } from "../utils/timelineUtils";
import { computePlanTimelineRows } from "../utils/planTimelineRows";
import { getConflictResolutionPlan } from "../components/MiniTimeline/ConflictPairRow";

const MAX_RELOCATE_OVERLAPS = 3;

export function buildDailyConflictPlans(allEvents, selectedDate, now = new Date()) {
  if (!selectedDate || !(allEvents || []).length) return [];
  const sorted = [...allEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  return getConflictDays(selectedDate, sorted).map((day) => buildDayPlan(day, sorted, now)).filter(Boolean);
}

export async function resolveConflictPlansBeforeScheduling({
  getFreshEvents,
  selectedDate,
  onConflictAutoMove,
  onPushTomorrow,
  maxIterations = 50,
}) {
  let events = await getFreshEvents();
  return resolveConflicts(events, { getFreshEvents, maxIterations, onConflictAutoMove, onPushTomorrow, selectedDate });
}

export function useAutoResolveScheduleConflicts({
  allEvents,
  selectedDate,
  onConflictAutoMove,
  onPushTomorrow,
  enabled = true,
}) {
  const runningRef = useRef(false);
  const plans = useMemo(() => buildDailyConflictPlans(allEvents, selectedDate), [allEvents, selectedDate]);

  useEffect(() => {
    if (!enabled || runningRef.current || !plans.length) return;
    const nextPlan = plans[0];
    runningRef.current = true;
    Promise.resolve(runConflictPlan(nextPlan, onConflictAutoMove, onPushTomorrow)).finally(() => {
      runningRef.current = false;
    });
  }, [enabled, plans, onConflictAutoMove, onPushTomorrow]);
}

function eventsOverlapWindow(event, start, end) {
  const eventStart = new Date(event.start_time).getTime();
  const eventEnd = new Date(event.end_time || event.start_time).getTime();
  return eventStart < end.getTime() && eventEnd > start.getTime();
}

export function canRelocateEventWithoutHittingOverlapLimit(allEvents, eventToMove, start, end) {
  const overlapCount = (allEvents || []).filter((event) => event?.id !== eventToMove?.id).filter((event) => eventsOverlapWindow(event, start, end)).length;
  return overlapCount < MAX_RELOCATE_OVERLAPS;
}

function getConflictDays(selectedDate, sortedEvents) {
  const firstDay = startOfDay(selectedDate);
  const lastDay = startOfDay(new Date(sortedEvents[sortedEvents.length - 1].end_time || sortedEvents[sortedEvents.length - 1].start_time));
  const days = [];
  for (let current = new Date(firstDay); current <= lastDay; current.setDate(current.getDate() + 1)) days.push(new Date(current));
  return days;
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildDayPlan(day, sortedEvents, now) {
  const dayEvents = getDayEvents(sortedEvents, day);
  if (!dayEvents.length) return null;
  const rows = buildTimelineRows(dayEvents, day, now);
  const conflictRow = rows.find((row) => row.type === "eventGroup");
  if (!conflictRow) return null;
  const plan = getConflictResolutionPlan({
    row: conflictRow,
    rows,
    selectedDate: day,
    canRelocateEvent: (event, start, end) => canRelocateEventWithoutHittingOverlapLimit(sortedEvents, event, start, end),
  });
  return plan ? { ...plan, day: new Date(day) } : null;
}

function getDayEvents(sortedEvents, day) {
  return sortedEvents.filter((event) => overlapsDay(new Date(event.start_time), new Date(event.end_time || event.start_time), day)).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

function buildTimelineRows(dayEvents, day, now) {
  const dayStart = new Date(day);
  const dayEnd = new Date(day);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
  dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);
  return computePlanTimelineRows(dayEvents, day, dayStart, dayEnd, now, [], [], () => false);
}

function runConflictPlan(nextPlan, onConflictAutoMove, onPushTomorrow) {
  return nextPlan.type === "auto-arrange"
    ? onConflictAutoMove?.(nextPlan.event, nextPlan.start, nextPlan.end, { silent: true })
    : onPushTomorrow?.(nextPlan.event, { silent: true });
}

async function resolveConflicts(initialEvents, options) {
  if (options.maxIterations <= 0) return initialEvents;
  const nextPlan = getNextConflictPlan(initialEvents, options.selectedDate);
  if (!nextPlan) return initialEvents;
  await runConflictPlan(nextPlan, options.onConflictAutoMove, options.onPushTomorrow);
  const events = await options.getFreshEvents();
  return resolveConflicts(events, { ...options, maxIterations: options.maxIterations - 1 });
}

function getNextConflictPlan(events, selectedDate) {
  return buildDailyConflictPlans(events, selectedDate)[0] || null;
}
