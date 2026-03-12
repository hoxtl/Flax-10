import { Clock3, Train, AlertTriangle } from "lucide-react";
import { getRelevantDelays, isSevereDisruption } from "../utils/kclTflMapping";

export function getGreeting(name) {
  const h = new Date().getHours();
  const timeOfDay = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `Good ${timeOfDay}${name ? `, ${name}` : ""}.`;
}

export function getTodayLabel() {
  const now = new Date();
  const day = now.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const date = now.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
  return `${day} · ${date}`;
}

export function formatWindowDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes < 60) return `${minutes}m`;
  return minutes % 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${Math.floor(minutes / 60)}h`;
}

export function getNextWindowMeta(windows = [], now = new Date()) {
  const upcoming = windows
    .filter((w) => w?.end && w.end.getTime() > now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  if (!upcoming) return null;
  const start = upcoming.start?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const mins = Math.max(0, Math.round((upcoming.end.getTime() - upcoming.start.getTime()) / 60000));
  return {
    label: start ? `Next focus window ${start}` : "Next focus window",
    duration: formatWindowDuration(mins),
  };
}

export function getNextStep({ tasksCount, nextWindowMeta }) {
  if (tasksCount > 0 && nextWindowMeta?.duration) {
    return `Use the ${nextWindowMeta.duration} window to move one priority task forward.`;
  }
  if (tasksCount > 0) return "Clear one meaningful task before the day fragments.";
  if (nextWindowMeta?.duration) return `Your next open block gives you ${nextWindowMeta.duration} to focus.`;
  return "Keep the timeline as the source of truth for the rest of today.";
}

export function isEventActive(event, nowMs) {
  if (!event?.start_time || !event?.end_time) return false;
  return new Date(event.start_time).getTime() <= nowMs && new Date(event.end_time).getTime() >= nowMs;
}

export function getCurrentEvent(sortedEvents = [], now = new Date()) {
  const nowMs = now.getTime();
  return sortedEvents.find((evt) => isEventActive(evt, nowMs)) || null;
}

export function getUpcomingEvent(sortedEvents = [], now = new Date()) {
  const nowMs = now.getTime();
  return [...sortedEvents]
    .filter((e) => e?.start_time && new Date(e.start_time).getTime() > nowMs)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0] || null;
}

export function formatEventTime(dateLike) {
  if (!dateLike) return null;
  return new Date(dateLike).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function buildTravelContextObj(event, delays) {
  const delay = delays[0];
  const severe = delays.some((d) => isSevereDisruption(d?.severityDescription));
  const time = formatEventTime(event.start_time);
  return {
    label: "Travel",
    text: `${delay?.lineName || "TfL"} line ${severe ? "disruption" : "delays"} — you may be late for your ${time ? `${time} ` : ""}${event.title || "class"}.`,
    meta: `${delay?.severityDescription || "Delays"}${event.location ? ` · ${event.location}` : ""}`,
    tone: "warning",
    Icon: Train,
  };
}

export function getTravelContext({ upcomingEvent, tflDelays, now = new Date() }) {
  if (!upcomingEvent?.start_time || !Array.isArray(tflDelays) || tflDelays.length === 0) return null;
  const minsUntilStart = Math.round((new Date(upcomingEvent.start_time).getTime() - now.getTime()) / 60000);
  if (minsUntilStart <= 0 || minsUntilStart > 120) return null;
  const relevantDelays = getRelevantDelays(upcomingEvent, tflDelays);
  if (!relevantDelays.length) return null;
  return buildTravelContextObj(upcomingEvent, relevantDelays);
}

export function buildCurrentEventContext(currentEvent) {
  return {
    label: "On now",
    text: `${currentEvent.title}${currentEvent.location ? ` · ${currentEvent.location}` : ""}`,
    meta: currentEvent.end_time ? `Until ${formatEventTime(currentEvent.end_time)}` : null,
    tone: "neutral",
    Icon: Clock3,
  };
}

export function buildOverlapContext(overlapA) {
  return {
    label: "Attention",
    text: "You have an overlap in today’s plan.",
    meta: overlapA?.a?.start_time ? `Conflict at ${formatEventTime(overlapA.a.start_time)}` : null,
    tone: "warning",
    Icon: AlertTriangle,
  };
}

export function buildUpcomingEventContext(upcomingEvent) {
  return {
    label: "Up next",
    text: `${upcomingEvent.title}${upcomingEvent.location ? ` · ${upcomingEvent.location}` : ""}`,
    meta: upcomingEvent.start_time ? `Starts ${formatEventTime(upcomingEvent.start_time)}` : null,
    tone: "neutral",
    Icon: Clock3,
  };
}

export function buildDefaultContext() {
  return {
    label: "Right now",
    text: "You have breathing room before the next thing starts.",
    meta: "Use the banner to decide what to move forward next.",
    tone: "neutral",
    Icon: Clock3,
  };
}

export function getLiveContext({ currentEvent, upcomingEvent, overlaps, tflDelays, now }) {
  if (currentEvent) return buildCurrentEventContext(currentEvent);
  if (overlaps?.length) return buildOverlapContext(overlaps[0]);
  const travelContext = getTravelContext({ upcomingEvent, tflDelays, now });
  if (travelContext) return travelContext;
  if (upcomingEvent) return buildUpcomingEventContext(upcomingEvent);
  return buildDefaultContext();
}
