/**
 * Homepage date/time formatting helpers. Pure functions only.
 */

export function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** Format time as HH:MM for display */
export function formatTimeHHMM(dateOrStr) {
  const d = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/** Format seconds as "17m" or "2h 15m" for UPCOMING countdown. */
export function formatScheduleCountdown(secs) {
  if (secs == null || secs < 0) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return mins ? `${h}h ${mins}m` : `${h}h`;
}

/** "In 2h 15m" from now to due date (for Action Hub upcoming cards). */
export function formatCountdownTo(dueDateStr) {
  if (!dueDateStr) return "";
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return "";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `In ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `In ${h}h ${m}m` : `In ${h}h`;
}

export function fmtDuration(mins) {
  if (mins == null) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Minutes-only for timeline duration pill: "60m", "25m", "90m" */
export function fmtDurationMinsOnly(mins) {
  if (mins == null) return "";
  return `${mins}m`;
}

/** Duration for plan timeline card: "1h 30m" or "45m". */
export function fmtDurationShort(mins) {
  if (mins == null || mins < 0) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function getTimeOfDay(date) {
  const d = date instanceof Date ? date : new Date(date);
  const h = d.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
