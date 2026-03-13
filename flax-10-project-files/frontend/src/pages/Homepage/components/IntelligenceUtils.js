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
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function getNextWindowMeta(windows = [], now = new Date()) {
  const upcoming = windows
    .filter((window) => window?.end && window.end.getTime() > now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  if (!upcoming) return null;
  const start = upcoming.start?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const minutes = Math.max(0, Math.round((upcoming.end.getTime() - upcoming.start.getTime()) / 60000));
  return {
    label: start ? `Next focus window ${start}` : "Next focus window",
    duration: formatWindowDuration(minutes),
  };
}

export function getNextStep({ tasksCount, nextWindowMeta }) {
  if (tasksCount > 0 && nextWindowMeta?.duration) {
    return `Use the ${nextWindowMeta.duration} window to move one priority task forward.`;
  }
  if (tasksCount > 0) {
    return "Clear one meaningful task before the day fragments.";
  }
  if (nextWindowMeta?.duration) {
    return `Your next open block gives you ${nextWindowMeta.duration} to focus.`;
  }
  return "Keep the timeline as the source of truth for the rest of today.";
}

export function getCurrentEvent(sortedEvents = [], now = new Date()) {
  const nowMs = now.getTime();
  return sortedEvents.find((event) => {
    if (!event?.start_time || !event?.end_time) return false;
    const startMs = new Date(event.start_time).getTime();
    const endMs = new Date(event.end_time).getTime();
    return startMs <= nowMs && endMs >= nowMs;
  }) || null;
}

export function getUpcomingEvent(sortedEvents = [], now = new Date()) {
  const nowMs = now.getTime();
  return [...sortedEvents]
    .filter((event) => event?.start_time && new Date(event.start_time).getTime() > nowMs)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0] || null;
}

export function formatEventTime(dateLike) {
  if (!dateLike) return null;
  return new Date(dateLike).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function getTravelContext({ upcomingEvent, tflDelays, now, getRelevantDelays, isSevereDisruption }) {
  if (!upcomingEvent?.start_time || !Array.isArray(tflDelays) || tflDelays.length === 0) return null;

  const startMs = new Date(upcomingEvent.start_time).getTime();
  const minsUntilStart = Math.round((startMs - now.getTime()) / 60000);
  if (minsUntilStart <= 0 || minsUntilStart > 120) return null;

  const relevantDelays = getRelevantDelays(upcomingEvent, tflDelays);
  if (!relevantDelays.length) return null;

  const primaryDelay = relevantDelays[0];
  const lineName = primaryDelay?.lineName || "TfL";
  const severity = primaryDelay?.severityDescription || "Delays";
  const severe = relevantDelays.some((delay) => isSevereDisruption(delay?.severityDescription));
  const eventTime = formatEventTime(upcomingEvent.start_time);
  const eventTitle = upcomingEvent.title || "your next class";
  const locationMeta = upcomingEvent.location ? ` · ${upcomingEvent.location}` : "";

  return {
    label: "Travel",
    text: `${lineName} line ${severe ? "disruption" : "delays"} — you may be late for your ${eventTime ? `${eventTime} ` : ""}${eventTitle}.`,
    meta: `${severity}${locationMeta}`,
    tone: "warning",
    iconKey: "Train",
  };
}

export function getLiveContext({ currentEvent, upcomingEvent, overlaps, tflDelays, now, getRelevantDelays, isSevereDisruption }) {
  if (currentEvent) {
    return {
      label: "On now",
      text: `${currentEvent.title}${currentEvent.location ? ` · ${currentEvent.location}` : ""}`,
      meta: currentEvent.end_time ? `Until ${formatEventTime(currentEvent.end_time)}` : null,
      tone: "neutral",
      iconKey: "Clock3",
    };
  }
  if (overlaps?.length) {
    const first = overlaps[0]?.a?.start_time;
    return {
      label: "Attention",
      text: "You have an overlap in today’s plan.",
      meta: first ? `Conflict at ${formatEventTime(first)}` : null,
      tone: "warning",
      iconKey: "AlertTriangle",
    };
  }
  const travelContext = getTravelContext({ upcomingEvent, tflDelays, now, getRelevantDelays, isSevereDisruption });
  if (travelContext) {
    return travelContext;
  }
  if (upcomingEvent) {
    return {
      label: "Up next",
      text: `${upcomingEvent.title}${upcomingEvent.location ? ` · ${upcomingEvent.location}` : ""}`,
      meta: upcomingEvent.start_time ? `Starts ${formatEventTime(upcomingEvent.start_time)}` : null,
      tone: "neutral",
      iconKey: "Clock3",
    };
  }
  return {
    label: "Right now",
    text: "You have breathing room before the next thing starts.",
    meta: "Use the banner to decide what to move forward next.",
    tone: "neutral",
    iconKey: "Clock3",
  };
}
