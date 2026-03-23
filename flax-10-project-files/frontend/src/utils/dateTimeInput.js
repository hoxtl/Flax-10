/*
 * Shared date-time input formatting helper.
 */

export function formatForDateTimeInput(value) {
  if (!value) return new Date().toISOString().slice(0, 16);
  const date = typeof value === "string" ? new Date(value) : value;
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}
