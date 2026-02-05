export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function isToday(d) {
  return isSameDay(d, new Date());
}

export function addDays(d, n) {
  const x = new Date(d); x.setDate(x.getDate() + n);
  return x;
}

export function parseDateInput(v) {
  if (!v) return null;
  const x = new Date(v); x.setHours(0, 0, 0, 0);
  return x;
}

export function formatDayLabel(date, today = new Date()) {
  if (isSameDay(date, today)) return "Today";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
