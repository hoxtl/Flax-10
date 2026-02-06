export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// Date utility functions for consistent date handling across the app.
export function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  return x;
}

// Checks if two dates are on the same calendar day (ignoring time).
export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

// Checks if a date is today.
export function isToday(d) {
  return isSameDay(d, new Date());
}

// Adds n days to a date and returns the new date.
export function addDays(d, n) {
  const x = new Date(d); x.setDate(x.getDate() + n);
  return x;
}

// Parses a "YYYY-MM-DD" string from a date input and returns a Date object at start of that day.
export function parseDateInput(v) {
  if (!v) return null;
  const x = new Date(v); x.setHours(0, 0, 0, 0);
  return x;
}

// Formats a date as "Today" if it's today, otherwise as ex. "Wed, Sep 15, 2024".
export function formatDayLabel(date, today = new Date()) {
  if (isSameDay(date, today)) return "Today";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
