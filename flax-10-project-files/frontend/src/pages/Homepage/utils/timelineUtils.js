export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 24;
/** Gaps below this get a thin line; 30+ get the full ghost "Gap Card". */
export const GAP_CARD_THRESHOLD_MINS = 30;
/** Vertical px between rows for compact list-style timeline. */
export const FIXED_ROW_GAP_PX = 4;

/**
 * @param {Date | string} selectedDate
 * @param {number} gapStartMins minutes from day start (DAY_START_HOUR)
 * @returns {Date}
 */
export function getGapStartDate(selectedDate, gapStartMins) {
  const d = new Date(selectedDate);
  d.setHours(DAY_START_HOUR, 0, 0, 0);
  d.setTime(d.getTime() + (gapStartMins || 0) * 60 * 1000);
  return d;
}

/**
 * @param {string | Date} startTime
 * @param {string | Date} endTime
 * @returns {number | null} 0–100 percent where "now" falls within the range, or null if now is outside
 */
export function getNowLinePercent(startTime, endTime) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const now = Date.now();
  if (now <= start || now >= end) return null;
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}
