/**
 * Contextual travel alert — schedule-aware TfL status for the next event.
 * Uses getRelevantDelays (location → lines) and severity to build headline, recommendation, leave-by.
 *
 * @typedef {'good'|'minor'|'severe'|'suspended'} TravelSeverity
 * @typedef {{ id: string; name: string; status: string }} AffectedLine
 * @typedef {{ name: string; time: string }} RelatedEvent
 * @typedef {Object} SavedRouteEntry
 * @property {string[]} lines - TfL line IDs
 * @property {number} durationMinutes - Normal commute duration
 * @property {string} [alternatives] - e.g. "68 bus, 15 min walk from Waterloo"
 *
 * @typedef {Object} ContextualTravelAlert
 * @property {TravelSeverity} severity
 * @property {string} headline
 * @property {string} recommendation
 * @property {AffectedLine[]} affectedLines
 * @property {string|null} leaveBy - Formatted time string for UI (e.g. "8:25 AM")
 * @property {Date|null} suggestedLeaveBy - Leave-by as Date for calculations
 * @property {RelatedEvent|null} relatedEvent - Next event name and time
 * @property {boolean} hasRelevantAlert
 */

import { getRelevantDelays, getTflLineColor, isSevereDisruption } from "./kclTflMapping";
import { formatTime } from "./dateFormatUtils";

/** TfL line id (API) → hex. Used for line pills and leave-by badge. */
export const TFL_LINE_COLOURS = {
  bakerloo: "#B36305",
  central: "#E32017",
  circle: "#FFD300",
  district: "#00782A",
  "hammersmith-city": "#F3A9BB",
  jubilee: "#A0A5A9",
  metropolitan: "#9B0056",
  northern: "#000000",
  piccadilly: "#003688",
  victoria: "#0098D4",
  "waterloo-city": "#95CDBA",
  elizabeth: "#6950A1",
  dlr: "#00A4A7",
  overground: "#EE7C0E",
  "london-overground": "#EE7C0E",
  tram: "#84B817",
};

/** Severity levels for UI (dot, card border, leave-by badge). */
export const TRAVEL_SEVERITY = {
  GOOD: "good",
  MINOR: "minor",
  SEVERE: "severe",
  SUSPENDED: "suspended",
};

/**
 * Infer severity from relevant delays.
 * @param {Array} relevantDelays - From getRelevantDelays(nextEvent, tflDelays)
 * @returns {'good'|'minor'|'severe'|'suspended'}
 */
export function getTravelSeverity(relevantDelays) {
  if (!relevantDelays?.length) return TRAVEL_SEVERITY.GOOD;
  const hasSuspended = relevantDelays.some((d) =>
    (d.severityDescription || "").toLowerCase().includes("suspension")
  );
  if (hasSuspended) return TRAVEL_SEVERITY.SUSPENDED;
  const hasSevere = relevantDelays.some((d) => isSevereDisruption(d.severityDescription));
  if (hasSevere) return TRAVEL_SEVERITY.SEVERE;
  return TRAVEL_SEVERITY.MINOR;
}

/**
 * Get colour for the status dot by severity.
 */
export function getSeverityDotColor(severity) {
  switch (severity) {
    case TRAVEL_SEVERITY.GOOD:
      return "#4CAF50";
    case TRAVEL_SEVERITY.MINOR:
      return "#F9A825";
    case TRAVEL_SEVERITY.SEVERE:
    case TRAVEL_SEVERITY.SUSPENDED:
      return "#D32F2F";
    default:
      return "#4CAF50";
  }
}

/**
 * Build contextual travel alert for the next event.
 * @param {Object} nextEvent - { location?, title?, start_time?, commuteLines?, commuteMinutes? }
 * @param {Array} tflDelays - From tflService.getTfLDelays()
 * @param {Object} options - { leaveEarlyMinutes?: number, savedRoutes?: string[] | Record<string, SavedRouteEntry>, normalCommuteMinutes?: number }
 * @returns {ContextualTravelAlert}
 */
export function getContextualTravelAlert(nextEvent, tflDelays, options = {}) {
  const leaveEarlyMinutes = options.leaveEarlyMinutes ?? 10;
  const normalCommuteMinutes = options.normalCommuteMinutes ?? (nextEvent?.commuteMinutes ?? nextEvent?.commuteTimeMinutes ?? 25);
  const relevantDelays = nextEvent ? getRelevantDelays(nextEvent, tflDelays) : [];
  const severity = relevantDelays.length
    ? getTravelSeverity(relevantDelays)
    : (tflDelays?.length ? TRAVEL_SEVERITY.MINOR : TRAVEL_SEVERITY.GOOD);

  if (!nextEvent || !relevantDelays.length) {
    const anyDelays = (tflDelays || []).length > 0;
    return {
      severity: anyDelays ? TRAVEL_SEVERITY.MINOR : TRAVEL_SEVERITY.GOOD,
      headline: anyDelays ? "Some lines have delays — your route looks fine" : "All lines running normally",
      affectedLines: [],
      recommendation: anyDelays
        ? "Your commute route looks clear — no action needed."
        : "No disruptions on your saved routes.",
      leaveBy: null,
      suggestedLeaveBy: null,
      relatedEvent: null,
      hasRelevantAlert: false,
    };
  }

  const eventTimeStr = nextEvent.start_time ? formatTime(nextEvent.start_time) : "";
  const locationStr = (nextEvent.location || "").trim();
  const eventTitle = (nextEvent.title || "").trim();
  const eventRef = eventTitle ? `your ${eventTimeStr} ${eventTitle}` : `your ${eventTimeStr} event`;

  const minsUntilEvent = nextEvent.start_time
    ? Math.floor((new Date(nextEvent.start_time).getTime() - Date.now()) / 60000)
    : null;

  const affectedLines = relevantDelays.map((d) => ({
    id: (d.lineName || "").toLowerCase().replace(/\s+/g, "-"),
    name: d.lineName,
    status: d.severityDescription || "Disruption",
    lineName: d.lineName,
    color: d.color || getTflLineColor(d.lineName),
    severityDescription: d.severityDescription || "Disruption",
  }));

  const lineNames = [...new Set(affectedLines.map((l) => l.lineName))].join(" & ");
  const severityBufferMinutes =
    severity === TRAVEL_SEVERITY.SUSPENDED ? 30
    : severity === TRAVEL_SEVERITY.SEVERE ? 20
    : severity === TRAVEL_SEVERITY.MINOR ? leaveEarlyMinutes
    : 0;
  const totalMinutesBefore = normalCommuteMinutes + severityBufferMinutes;

  // Time-aware headline tiers
  let headline;
  if (severity === TRAVEL_SEVERITY.SUSPENDED) {
    headline = minsUntilEvent !== null && minsUntilEvent < 30
      ? `${lineNames} suspended — ${eventRef} is in ${minsUntilEvent}m, plan B needed now`
      : `${lineNames} suspended — you'll need an alternative route for ${eventRef}`;
  } else if (severity === TRAVEL_SEVERITY.SEVERE) {
    headline = minsUntilEvent !== null && minsUntilEvent < 30
      ? `Severe disruption — ${eventRef} starts in ${minsUntilEvent}m, head out now`
      : `${lineNames} severely disrupted — leave early for ${eventRef}`;
  } else {
    if (minsUntilEvent !== null && minsUntilEvent < 30) {
      headline = `${lineNames} delays — ${eventRef} is soon, leave now`;
    } else if (minsUntilEvent !== null && minsUntilEvent < 90) {
      headline = `${lineNames} delays — leave ${severityBufferMinutes} mins early for ${eventRef}`;
    } else {
      headline = `${lineNames} delays — keep an eye on this before ${eventRef}`;
    }
  }

  // Student-friendly recommendation
  let recommendation;
  if (severity === TRAVEL_SEVERITY.SUSPENDED) {
    recommendation = `${lineNames} is suspended. Check TfL for alternatives${locationStr ? ` to ${locationStr}` : ""} — you don't want to miss this one.`;
  } else if (severity === TRAVEL_SEVERITY.SEVERE) {
    recommendation = `Things are bad on ${lineNames}. Leave ${severityBufferMinutes} mins earlier than usual${locationStr ? ` to get to ${locationStr}` : ""}.`;
  } else {
    recommendation = `${lineNames} is running slow — leaving ${severityBufferMinutes} mins early should cover it.`;
  }

  const savedRoutes = options.savedRoutes;
  if (severity === TRAVEL_SEVERITY.SUSPENDED && savedRoutes && typeof savedRoutes === "object" && !Array.isArray(savedRoutes)) {
    const locKey = (locationStr || "").toLowerCase().trim();
    const routeEntry = savedRoutes[locKey] || (Object.values(savedRoutes)[0]);
    if (routeEntry?.alternatives) {
      recommendation = recommendation.trim() + ` Try: ${routeEntry.alternatives}.`;
    }
  }

  let suggestedLeaveBy = null;
  let leaveBy = null;
  if (nextEvent.start_time && (severity === TRAVEL_SEVERITY.MINOR || severity === TRAVEL_SEVERITY.SEVERE || severity === TRAVEL_SEVERITY.SUSPENDED)) {
    const eventStart = new Date(nextEvent.start_time).getTime();
    const leaveByMs = eventStart - totalMinutesBefore * 60 * 1000;
    suggestedLeaveBy = new Date(leaveByMs);
    leaveBy = suggestedLeaveBy.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const relatedEvent = {
    name: (nextEvent.title || "Event").trim() || "Event",
    time: eventTimeStr,
  };

  return {
    severity,
    headline,
    affectedLines,
    recommendation: recommendation.trim(),
    leaveBy,
    suggestedLeaveBy,
    relatedEvent,
    hasRelevantAlert: true,
  };
}
