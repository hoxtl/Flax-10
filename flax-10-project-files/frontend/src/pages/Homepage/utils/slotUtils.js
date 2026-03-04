/**
 * Helpers for time-slot classification (e.g. night vs day).
 */

/**
 * @param {Date | string} dateOrIso
 * @returns {boolean} true if the time is in a "night" window (e.g. 21:00–06:00)
 */
export function isNightSlot(dateOrIso) {
  const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
  const h = d.getHours();
  return h >= 21 || h < 6;
}
