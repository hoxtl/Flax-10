/*
 * Shared sleep-window helpers.
 */
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
