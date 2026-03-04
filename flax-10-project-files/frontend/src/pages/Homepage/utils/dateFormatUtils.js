/**
 * Date/time formatting for Homepage (RightNowWidget etc.).
 * formatTime accepts Date or ISO string.
 */

function toDate(v) {
  if (v == null) return null;
  return typeof v === "string" ? new Date(v) : v;
}

export function formatTime(dateOrIso) {
  const d = toDate(dateOrIso);
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Format seconds until next event as "in Xm" or "in Xh Ym".
 */
export function formatScheduleCountdown(seconds) {
  if (seconds == null || seconds < 0) return "";
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h > 0) return `in ${h}h${mins > 0 ? ` ${mins}m` : ""}`;
  return `in ${m}m`;
}

/** Format time as HH:MM for display */
export function formatTimeHHMM(dateOrStr) {
  const d = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function fmtDuration(mins) {
  if (mins == null) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Duration for plan timeline card: "1h 30m" or "45m". */
export function fmtDurationShort(mins) {
  if (mins == null || mins < 0) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
