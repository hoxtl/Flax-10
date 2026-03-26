/*
 * Right Now data helpers.
 */

import { isNow } from "../utils/eventUtils";
import { getTflLinesForLocation, isSevereDisruption } from "../utils/kclTflMapping";

export function getTimeLeftBand(minutesLeft) {
  if (minutesLeft == null || minutesLeft < 0) return "over";
  if (minutesLeft < 10) return "under10";
  if (minutesLeft < 30) return "10to30";
  return "over30";
}

export function getCurrentBlock(sortedEvents) {
  const list = Array.isArray(sortedEvents) ? sortedEvents : [];
  return list.find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time)) || null;
}

export function getNextEvent(sortedEvents, now) {
  const list = Array.isArray(sortedEvents) ? sortedEvents : [];
  const nowMs = now.getTime();
  return list
    .filter((e) => e.start_time && new Date(e.start_time).getTime() > nowMs)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0] || null;
}

export function hasCampusCommute(nextEvent) {
  if (!nextEvent) return false;
  const loc = (nextEvent.location || "").trim();
  const title = (nextEvent.title || "").trim();
  return getTflLinesForLocation(loc).length > 0 || getTflLinesForLocation(title).length > 0;
}

export function formatTimeLeft(endTime, nowMs) {
  if (!endTime) return null;
  const ms = new Date(endTime).getTime() - nowMs;
  if (ms <= 0) return "Ended";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m left` : `${m}m left`;
}

export function getJourneySummary(journey) {
  if (!journey) return null;
  const legs = journey.legs || [];
  const lines = legs.flatMap((leg) => leg.routeOptions?.map((option) => option?.name).filter(Boolean) || []);
  const uniqueLines = [...new Set(lines)];
  return {
    duration: Number.isFinite(journey.duration) ? `${journey.duration} min` : null,
    mode: legs[0]?.mode ? legs[0].mode.replace(/_/g, " ") : "journey",
    lines: uniqueLines.slice(0, 3),
  };
}

function computeLeaveByTiming(startMs, hasSevere, nowMs) {
  const leaveByMs = startMs - (35 + (hasSevere ? 20 : 10)) * 60000;
  const minsUntilLeave = Math.floor((leaveByMs - nowMs) / 60000);
  const leaveByStr = new Date(leaveByMs).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const urgency = nowMs >= leaveByMs ? "critical" : minsUntilLeave <= 15 ? "urgent" : "info";
  const lead = nowMs >= leaveByMs ? "Leave now" : minsUntilLeave <= 15 ? `Leave in ${minsUntilLeave} min` : `Leave by ${leaveByStr}`;
  return { leaveByMs, minsUntilLeave, leaveByStr, urgency, lead };
}

export function getLeaveByInfo(nextEvent, relevantDelays, nowMs) {
  if (!nextEvent?.start_time || !relevantDelays.length) return null;
  const startMs = new Date(nextEvent.start_time).getTime();
  const hasSevere = relevantDelays.some((d) => isSevereDisruption(d.severityDescription));
  const timing = computeLeaveByTiming(startMs, hasSevere, nowMs);
  const lineName = relevantDelays[0]?.lineName || "TfL";
  const severity = relevantDelays[0]?.severityDescription || "Delays";
  const eventTitle = nextEvent.title || "your next event";
  return { urgency: timing.urgency, leaveByStr: timing.leaveByStr, minsUntilLeave: timing.minsUntilLeave, hasSevere, lineName, severity, eventTime: new Date(nextEvent.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), eventTitle, message: `${lineName}: ${severity}. ${timing.lead} for ${eventTitle}.` };
}
