/*
 * Auto schedule conflict resolution.
 */
import { getEvents, updateEvent } from '../../../api/eventApi';
import { resolveConflictPlansBeforeScheduling } from '../../../pages/Homepage/components/useAutoResolveScheduleConflicts';
import { getMoveTomorrowWindow } from './autoScheduleUtils';

export async function resolveScheduleConflicts() {
  await resolveConflictPlansBeforeScheduling(buildResolverActions());
}

function buildResolverActions() {
  return {
    getFreshEvents: () => getEvents(),
    selectedDate: new Date(),
    onConflictAutoMove: moveScheduledEvent,
    onPushTomorrow: pushScheduledEventTomorrow,
  };
}

async function moveScheduledEvent(event, startTime, endTime) {
  return updateEvent(event.id, toEventWindow(startTime, endTime));
}

async function pushScheduledEventTomorrow(event) {
  const window = getMoveTomorrowWindow(event);
  return moveScheduledEvent(event, window.start, window.end);
}

function toEventWindow(startTime, endTime) {
  return { start_time: startTime.toISOString(), end_time: endTime.toISOString() };
}
