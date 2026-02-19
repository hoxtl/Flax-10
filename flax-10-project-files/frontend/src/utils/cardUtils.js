import { isSameDay } from "./dateUtils";

export function getCardTheme(type) {
  return THEMES[type] || THEMES.other;
}

export function formatTimeRange(e, refDate) {
  if (isAllDay(e)) return "All Day";
  if (!e.start_time || !e.end_time) return "—";

  const start = new Date(e.start_time);
  const end = new Date(e.end_time);

  if (isInferredAllDay(start, end)) return "All Day";
  if (refDate) return formatContextTime(start, end, new Date(refDate));

  return formatRange(start, end);
}

function isAllDay(e) {
  return e.all_day || e.is_all_day || e.allDay;
}

function isInferredAllDay(start, end) {
  return isMidnight(start) && isMidnight(end);
}

function isMidnight(date) {
  return date.getHours() === 0 && date.getMinutes() === 0;
}

function formatContextTime(start, end, ref) {
  const sameStart = isSameDay(start, ref);
  const sameEnd = isSameDay(end, ref);

  if (sameStart && sameEnd) return formatRange(start, end);
  if (sameStart) return `Starts ${formatTime(start)}`;
  if (sameEnd) return `Ends ${formatTime(end)}`;

  return "All Day";
}

function formatRange(start, end) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const THEMES = {
  travel: { accent: "#60A5FA", icon: "🚌" },
  class: { accent: "#A78BFA", icon: "📚" },
  study: { accent: "#34D399", icon: "🧠" },
  task: { accent: "#FBBF24", icon: "✅" },
  other: { accent: "#94A3B8", icon: "⭐" },
};

//Functions to represent deadline event as a widget
export function isDeadlineEvent(e) {
  return e.source === 'module_deadline';
}

export function formatDeadlineDate(e) {
  if (!e.start_time) return '-';
  const data = new Date(e.start_time);
  return `Due: ${date.toLocaleDateString('en-GB', {dat: 'numeric', month: 'long', year:'numeric'
  })}, ${formatTime(date)}`;
}
