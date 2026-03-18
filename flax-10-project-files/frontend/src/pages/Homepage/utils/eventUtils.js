/**
 * Homepage event helpers. Pure functions only.
 */

/** Remove emoji and other symbols from a string for clean timeline titles. */
export function stripEmojiFromTitle(str) {
  if (typeof str !== "string") return str ?? "";
  return str
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isLecture(item) {
  const t = (item?.title || "").toLowerCase();
  return t.includes("lecture") || t.includes("seminar") || t.includes("tutorial") || item?.source === "timetable";
}

export function isRoutineEvent(item) {
  const title = (item?.title || "").toLowerCase();
  const tagName = (item?.tag_name ?? item?.tag?.name ?? "").toString().toLowerCase();
  if (tagName === "routine" || tagName === "wellness") return true;
  return /breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack|commute/i.test(title);
}

export function isNow(startStr, endStr) {
  if (!startStr || !endStr) return false;
  const now = new Date();
  return new Date(startStr) <= now && now <= new Date(endStr);
}

export function extractModuleCode(str) {
  const match = (str || "").match(/\b([A-Z]{2,3}\d{4})\b/);
  return match ? match[1] : null;
}
