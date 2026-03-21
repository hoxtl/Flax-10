/*
 * Shared sleep-window helpers.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export function isDuringSleepWindow(sleepTime, wakeTime, date = new Date()) {
  const [sleepHours, sleepMinutes] = sleepTime.split(":").map(Number);
  const [wakeHours, wakeMinutes] = wakeTime.split(":").map(Number);
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  const sleepTotal = sleepHours * 60 + sleepMinutes;
  const wakeTotal = wakeHours * 60 + wakeMinutes;
  return sleepTotal > wakeTotal
    ? totalMinutes >= sleepTotal || totalMinutes < wakeTotal
    : totalMinutes >= sleepTotal && totalMinutes < wakeTotal;
}
<<<<<<< HEAD

function generateTimeCheckpoints(start, end) {
  const checkpoints = [];
  for (let cursor = new Date(start); cursor < end; cursor = new Date(cursor.getTime() + 15 * 60000)) checkpoints.push(cursor);
  checkpoints.push(end);
  return checkpoints;
}

function checkRangeForSleepOverlap(sleepTime, wakeTime, start, end) {
  return generateTimeCheckpoints(start, end).some((time) => isDuringSleepWindow(sleepTime, wakeTime, time));
}

export function doesEventOverlapSleepWindow(sleepTime, wakeTime, startDate, endDate) {
  if (!startDate) return false;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 25 * 60000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  if (end <= start) return isDuringSleepWindow(sleepTime, wakeTime, start);
  return checkRangeForSleepOverlap(sleepTime, wakeTime, start, end);
}
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
