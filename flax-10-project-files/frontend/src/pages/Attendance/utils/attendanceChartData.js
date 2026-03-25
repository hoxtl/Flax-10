/*
 * Attendance chart data builders.
 */

import chartColors from './attendanceChartColors.json';

const TYPE_COLOR_MAP = chartColors.typeColors;
const FALLBACK_TYPE_COLORS = chartColors.fallbackTypeColors;

export function buildOverallChartData(overall) {
  const attended = overall?.attended ?? 0;
  const missed = overall?.missed ?? 0;
  return [{ id: 0, value: attended, label: "Attended", color: chartColors.attendedColor }, { id: 1, value: missed, label: "Missed", color: chartColors.missedColor }].filter((entry) => entry.value > 0);
}

export function getEventTypeLabel(event) {
  return inferTypeFromTitle(event) ?? normalizeTypeLabel(readTagName(event));
}

export function buildByTypeChartData(byType) {
  const merged = mergeByNormalizedType(byType);
  return Object.entries(merged).map(([label, counts]) => ({ id: label, value: (counts.attended || 0) + (counts.missed || 0), label, color: TYPE_COLOR_MAP[label] ?? chartColors.fallbackColor })).filter((entry) => entry.value > 0);
}

export function withByTypeColors(entries) {
  return entries.map((entry, index) => ({ ...entry, id: index, color: entry.color ?? FALLBACK_TYPE_COLORS[index % FALLBACK_TYPE_COLORS.length] }));
}

function normalizeTypeLabel(name) {
  const lower = typeof name === "string" ? name.toLowerCase().trim() : "";
  if (lower.includes("lecture") || lower.includes("lgt")) return "Lecture";
  if (lower.includes("small group") || lower === "smg") return "Small group";
  if (lower.includes("practical") || lower.includes("lab")) return "Practical/lab";
  return "Other";
}

function inferTypeFromTitle(event) {
  const text = [event?.title, event?.description].filter(Boolean).join(" ").toLowerCase();
  if (!text) return null;
  if (text.includes("briefing")) return "Other";
  if (text.includes("lecture") || text.includes("lgt")) return "Lecture";
  if (text.includes("smg") || text.includes("small group")) return "Small group";
  if (text.includes("practical") || text.includes("lab")) return "Practical/lab";
  return null;
}

function readTagName(event) {
  return event?.tag_name ?? event?.tag_details?.name ?? event?.tag?.name ?? (typeof event?.tag === "string" ? event.tag : "");
}

function mergeByNormalizedType(byType) {
  return Object.entries(byType ?? {}).reduce(addByTypeEntry, {});
}

function addByTypeEntry(merged, [name, counts]) {
  const label = normalizeTypeLabel(name);
  const current = merged[label] ?? { attended: 0, missed: 0 };
  return { ...merged, [label]: { attended: current.attended + (counts.attended || 0), missed: current.missed + (counts.missed || 0) } };
}
