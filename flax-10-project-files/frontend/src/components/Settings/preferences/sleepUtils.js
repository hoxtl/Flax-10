/*
 * Sleep-schedule formatting helpers.
 */

export function getSleepMinutes(sleepTime, wakeTime) {
  const [sleepHours, sleepMinutes] = sleepTime.split(":").map(Number);
  const [wakeHours, wakeMinutes] = wakeTime.split(":").map(Number);
  const diff = wakeHours * 60 + wakeMinutes - (sleepHours * 60 + sleepMinutes);
  return diff > 0 ? diff : diff + 24 * 60;
}

export function getSleepDuration(sleepTime, wakeTime) {
  const totalMinutes = getSleepMinutes(sleepTime, wakeTime);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const label = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return { label, meta: `${totalMinutes} minutes total`, totalMinutes };
}

export function getSleepQuality(totalMinutes) {
  const hours = totalMinutes / 60;
  if (hours > 9) return { color: "var(--sleep-quality-too-much)", label: "Too much" };
  if (hours >= 7) return { color: "var(--sleep-quality-great)", label: "Great" };
  if (hours >= 5) return { color: "var(--sleep-quality-fair)", label: "Fair" };
  return { color: "var(--sleep-quality-low)", label: "Low" };
}
