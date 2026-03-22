/*
 * Shared formatting and layout helpers for free and tiny gap rows.
 */

import { DAY_START_HOUR } from "../../../utils/timelineUtils";
import { formatHour12h } from "../../../utils/dateFormatUtils";

export function formatGapDuration(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function getGapMinHeight(rowMinutes, gapStartMins) {
  const endMins = (gapStartMins || 0) + (rowMinutes || 0);
  const crossedHours = Math.max(0, Math.floor(endMins / 60) - Math.floor((gapStartMins || 0) / 60));
  const compensation = crossedHours * 22;
  const baseHeight = Math.round((rowMinutes || 0) * 1.2) + compensation;
  return rowMinutes > 0 ? Math.max(56, Math.min(baseHeight, 260)) : 56;
}

export function getTinyGapMinHeight(minutes) {
  return minutes > 0 ? Math.max(24, Math.min(Math.round(minutes * 1.15), 44)) : 24;
}

export function getGapTimeLabel(startMins) {
  return formatHour12h(Math.floor(DAY_START_HOUR + startMins / 60), startMins % 60);
}

export function getTinyGapTimeLabel(startMins) {
  const hours = String(Math.floor(DAY_START_HOUR + startMins / 60)).padStart(2, "0");
  const minutes = String(startMins % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getGapRecommendationTitle(task) {
  return task?.title || "";
}
