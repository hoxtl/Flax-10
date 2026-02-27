/**
 * Homepage event helpers. Pure functions only.
 */

/* Unified color language: study = caramel/gold, life = greige */
const STUDY_ACCENT = "#c4a35a";
const LIFE_ACCENT = "#9c8f7e";

export const PRIORITY_COLOURS = {
  urgent: "var(--urgent)",
  high: "var(--study)",
  medium: "var(--personal)",
  low: "var(--neutral)",
};

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

/** Event is major academic/work — only these go in Action Hub. */
export function isMajorAcademicOrWorkEvent(item) {
  if (!item) return false;
  if (isRoutineEvent(item)) return false;
  const title = (item?.title || "").toLowerCase();
  const tagName = (item?.tag_name ?? item?.tag?.name ?? "").toString().toLowerCase();
  return /lecture|seminar|meeting|exam|tutorial|lab\s*session|class/i.test(title) || /lecture|seminar|meeting|academic|exam/i.test(tagName);
}

export function isNow(startStr, endStr) {
  if (!startStr || !endStr) return false;
  const now = new Date();
  return new Date(startStr) <= now && now <= new Date(endStr);
}

export function isPast(endStr) {
  if (!endStr) return false;
  return new Date(endStr) < new Date();
}

export function eventAccentColor(item, matchTask, themeColor) {
  if (matchTask) return PRIORITY_COLOURS[matchTask.priority] || themeColor;
  if (isLecture(item) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/i.test(item.title || "")) return STUDY_ACCENT;
  if (/gym|lunch|dinner|breakfast|run|yoga|walk|coffee|cinema|drinks|meeting|shop|laundry/i.test(item.title || "")) return LIFE_ACCENT;
  return themeColor || "#94A3B8";
}

/** Left border color for timeline cards. */
export function scheduleCardBorderColor(item, matchTask) {
  if (matchTask?.priority === "urgent" || /deadline|urgent|due|submission/i.test(item.title || "")) return "#E85555";
  if (isLecture(item) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/i.test(item.title || "")) return "#3B82F6";
  if (/gym|run|yoga|walk|sport|exercise/i.test(item.title || "")) return "#22C897";
  if (/breakfast|lunch|dinner|coffee|meal|sleep|personal|admin|cinema|drinks|meeting|shop|laundry/i.test(item.title || "")) return "#6B7280";
  return "#6B7280";
}

/** Spine timeline: 4px left border only. Sage=Academic, Blue=Personal, Grey=Routine. */
export function spinePillBorderColor(item) {
  const t = (item.title || "").toLowerCase();
  const tag = (item.tag_name ?? item.tag ?? "").toString().toLowerCase();
  if (isLecture(item) || /academic|study|lecture|seminar|tutorial|exam|coursework/.test(tag) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/.test(t)) return "var(--color-sage-primary)";
  if (isRoutineEvent(item) || /breakfast|lunch|dinner|sleep|coffee|meal|routine|wellness/.test(t) || /routine|wellness/.test(tag)) return "#6B7280";
  return "#4f46e5"; /* Blue = Personal */
}

export function extractModuleCode(str) {
  const match = (str || "").match(/\b([A-Z]{2,3}\d{4})\b/);
  return match ? match[1] : null;
}

export function resolveEventIcon(event, tagIcon) {
  const t = (event.title || "").toLowerCase();
  const src = (event.source || "").toLowerCase();
  if (t === "breakfast") return "🌅";
  if (t === "lunch") return "🥗";
  if (t === "dinner") return "🍽️";
  if (t.includes("lecture") || t.includes("seminar") || t.includes("tutorial")) return "📖";
  if (t.includes("practical") || t.includes("lab")) return "🔬";
  if (t.includes("workshop")) return "🛠️";
  if (t.includes("exam") || t.includes("test")) return "📝";
  if (t.includes("submission") || t.includes("coursework")) return "📤";
  if (t.includes("revision") || t.includes("study")) return "📚";
  if (t.includes("library")) return "📚";
  if (t.includes("group project") || t.includes("group meeting")) return "🤝";
  if (t.includes("presentation") || t.includes("seminar")) return "🎤";
  if (t.includes("dentist")) return "🦷";
  if (t.includes("gp") || t.includes("doctor")) return "🩺";
  if (t.includes("appointment")) return "📋";
  if (t.includes("gym") || t.includes("basketball") || t.includes("sport")) return "🏋️";
  if (t.includes("run") || t.includes("jog")) return "🏃";
  if (t.includes("yoga") || t.includes("stretch") || t.includes("meditat")) return "🧘";
  if (t.includes("walk")) return "🚶";
  if (t.includes("coffee") || t.includes("costa") || t.includes("pret")) return "☕";
  if (t.includes("brunch")) return "🍳";
  if (t.includes("drinks") || t.includes("pub")) return "🍻";
  if (t.includes("birthday")) return "🎂";
  if (t.includes("cinema") || t.includes("movie")) return "🎬";
  if (t.includes("facetime") || t.includes("call") || t.includes("phone")) return "📞";
  if (t.includes("meeting")) return "🤝";
  if (t.includes("email") || t.includes("reply")) return tagIcon && tagIcon !== "📅" ? tagIcon : "📧";
  if (t.includes("shop") || t.includes("tesco") || t.includes("lidl") || t.includes("grocery")) return "🛒";
  if (t.includes("laundry") || t.includes("clean") || t.includes("tidy")) return "🧹";
  if (t.includes("parcel") || t.includes("inpost") || t.includes("delivery")) return "📦";
  if (t.includes("haircut") || t.includes("barber")) return "✂️";
  if (t.includes("train") || t.includes("travel") || t.includes("journey")) return "🚆";
  if (t.includes("rent") || t.includes("bills") || t.includes("finance")) return "💸";
  if (t.includes("ikea")) return "🪑";
  if (src === "timetable") return "📖";
  if (tagIcon && tagIcon !== "📅") return tagIcon;
  return "📅";
}
