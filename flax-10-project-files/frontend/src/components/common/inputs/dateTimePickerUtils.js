/*
 * Pure helpers for DateTimePicker: constants, formatting, parsing, and event emission.
 */

export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export function pad(n) {
  return String(n).padStart(2, "0");
}

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: pad(i) }));
export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({ value: String(i), label: pad(i) }));

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

export function getDropdownHeight(timeOnly, dateOnly) {
  if (timeOnly) return 90;
  if (dateOnly) return 290;
  return 330;
}

export function getDropdownWidth() {
  return 340;
}

function formatDisplay(date) {
  return `${pad(date.getDate())} / ${pad(date.getMonth() + 1)} / ${date.getFullYear()}  ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateOnly(date) {
  return `${pad(date.getDate())} / ${pad(date.getMonth() + 1)} / ${date.getFullYear()}`;
}

export function getDisplayValue(date, timeOnly, dateOnly) {
  if (!date) return "";
  if (timeOnly) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (dateOnly) return formatDateOnly(date);
  return formatDisplay(date);
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isBeforeMinDate(value, minDate) {
  if (!value || !minDate) return false;
  const parsed = new Date(minDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return startOfDay(value).getTime() < startOfDay(parsed).getTime();
}

export function calendarDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

export function parseIncomingValue(value, timeOnly, dateOnly) {
  if (!value) return null;
  if (timeOnly && /^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
  if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, day] = value.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(value);
}

function formatOutput(d, timeOnly, dateOnly) {
  if (timeOnly) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (dateOnly) return datePart;
  return `${datePart}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function emitDateTimeChange(date, h, m, timeOnly, dateOnly, onChange) {
  if (!date) { onChange?.(""); return; }
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  onChange?.(formatOutput(d, timeOnly, dateOnly));
}

export function handleDaySelect(day, viewY, viewM, setSelDate, emitChange, hour, minute) {
  const d = new Date(viewY, viewM, day);
  setSelDate(d);
  emitChange(d, hour, minute);
}

export function handleHourChange(h, setHour, selDate, emitChange, minute) {
  setHour(h);
  if (selDate) emitChange(selDate, h, minute);
}

export function handleMinuteChange(m, setMinute, selDate, emitChange, hour) {
  setMinute(m);
  if (selDate) emitChange(selDate, hour, m);
}

export function navigateMonth(dir, viewM, setViewM, setViewY) {
  if (dir === -1 && viewM === 0) { setViewY(y => y - 1); setViewM(11); return; }
  if (dir === -1) { setViewM(m => m - 1); return; }
  if (viewM === 11) { setViewY(y => y + 1); setViewM(0); return; }
  setViewM(m => m + 1);
}
