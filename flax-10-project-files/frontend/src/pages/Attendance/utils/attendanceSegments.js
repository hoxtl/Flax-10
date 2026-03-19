/*
 * Attendance segment selection helpers.
 */

import { getEventTypeLabel } from "./attendanceChartData";

const segmentBuilders = {
  overall: buildOverallSegmentEvents,
  byType: buildByTypeSegmentEvents,
};

export function buildSegmentEvents(segment, markedEvents) {
  if (!segment) return [];
  return segmentBuilders[segment.chart]?.(segment, markedEvents) ?? [];
}

export function buildSegmentLabel(segment) {
  if (!segment) return null;
  return `${segment.chart === "overall" ? "Overall" : "By type"}: ${segment.label}`;
}

function buildOverallSegmentEvents(segment, markedEvents) {
  return markedEvents.filter((event) => event.attended === (segment.label === "Attended"));
}

function buildByTypeSegmentEvents(segment, markedEvents) {
  return markedEvents.filter((event) => getEventTypeLabel(event) === segment.label || event.event_type === segment.label);
}
