/**
 * Helpers for DateTimePicker: parse, format, calendar grid.
 */

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function formatDisplay(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + "  " + pad(date.getHours()) + ":" + pad(date.getMinutes());
}

export function calendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

export function parseIncomingValue(value, timeOnly) {
  if (!value) return null;
  if (timeOnly && /^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
  return new Date(value);
}

export function emitChange(onChange, timeOnly, date, h, m) {
  if (!date) {
    onChange?.("");
    return;
  }
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  if (timeOnly) {
    onChange?.(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    return;
  }
  const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  onChange?.(iso);
}
