/*
 * Auto schedule helpers.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export function getAutoScheduleError(deadlines) {
  return deadlines.length ? null : 'No upcoming deadlines to auto-schedule.';
}

export function buildAutoSchedulePayload(title, deadlines) {
  return {
    title: title.trim() || 'Auto schedule',
    deadline_preferences: deadlines.map(toDeadlinePreference),
  };
}

function toDeadlinePreference(deadline) {
  return { deadline_id: deadline.id, ideal_minutes_per_day: 60 };
}

export function getMoveTomorrowWindow(event) {
  const start = new Date(event.start_time);
  const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + 25 * 60000);
  return createMoveTomorrowWindow(start, end);
}

function createMoveTomorrowWindow(start, end) {
  const durationMins = Math.max(25, Math.round((end - start) / 60000) || 25);
  const nextDay = new Date(start);
  nextDay.setDate(nextDay.getDate() + 1);
  return { start: nextDay, end: new Date(nextDay.getTime() + durationMins * 60000) };
}
