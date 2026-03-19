import { useEffect, useMemo, useRef } from "react";
import { overlapsDay } from "../../../components/Calendar/utils/dateUtils";
import { DAY_START_HOUR, DAY_END_HOUR } from "../utils/timelineUtils";
import { computePlanTimelineRows } from "../utils/planTimelineRows";
import { getConflictResolutionPlan } from "../components/MiniTimeline/ConflictPairRow";

export function buildDailyConflictPlans(allEvents, selectedDate, now = new Date()) {
  if (!selectedDate || !(allEvents || []).length) return [];

  const sorted = [...allEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const firstDay = new Date(selectedDate);
  firstDay.setHours(0, 0, 0, 0);
  const lastEvent = sorted[sorted.length - 1];
  const lastDay = new Date(lastEvent.end_time || lastEvent.start_time);
  lastDay.setHours(0, 0, 0, 0);

  const plans = [];
  for (let current = new Date(firstDay); current <= lastDay; current.setDate(current.getDate() + 1)) {
    const day = new Date(current);
    const dayStart = new Date(day);
    dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);

    const dayEvents = sorted
      .filter((event) => overlapsDay(new Date(event.start_time), new Date(event.end_time || event.start_time), day))
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    if (!dayEvents.length) continue;

    const rows = computePlanTimelineRows(dayEvents, day, dayStart, dayEnd, now, [], [], () => false);
    const conflictRow = rows.find((row) => row.type === "eventGroup");
    if (!conflictRow) continue;

    const plan = getConflictResolutionPlan({ row: conflictRow, rows, selectedDate: day });
    if (plan) plans.push({ ...plan, day: new Date(day) });
  }

  return plans;
}

export async function resolveConflictPlansBeforeScheduling({
  getFreshEvents,
  selectedDate,
  onConflictAutoMove,
  onPushTomorrow,
  maxIterations = 50,
}) {
  let events = await getFreshEvents();

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const plans = buildDailyConflictPlans(events, selectedDate);
    const nextPlan = plans[0];
    if (!nextPlan) return events;

    if (nextPlan.type === "auto-arrange") {
      await onConflictAutoMove(nextPlan.event, nextPlan.start, nextPlan.end, { silent: true });
    } else {
      await onPushTomorrow(nextPlan.event, { silent: true });
    }

    events = await getFreshEvents();
  }

  return events;
}

export function useAutoResolveScheduleConflicts({
  allEvents,
  selectedDate,
  onConflictAutoMove,
  onPushTomorrow,
  enabled = true,
}) {
  const runningRef = useRef(false);
  const plans = useMemo(
    () => buildDailyConflictPlans(allEvents, selectedDate),
    [allEvents, selectedDate]
  );

  useEffect(() => {
    if (!enabled || runningRef.current || !plans.length) return;
    const nextPlan = plans[0];
    if (!nextPlan) return;

    runningRef.current = true;
    const action = nextPlan.type === "auto-arrange"
      ? onConflictAutoMove?.(nextPlan.event, nextPlan.start, nextPlan.end, { silent: true })
      : onPushTomorrow?.(nextPlan.event, { silent: true });

    Promise.resolve(action).finally(() => {
      runningRef.current = false;
    });
  }, [enabled, plans, onConflictAutoMove, onPushTomorrow]);
}
