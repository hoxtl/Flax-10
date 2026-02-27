/**
 * Homepage & MiniTimeline shared helpers. Pure functions only (no React/hooks).
 */
import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";

export function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatTimeHHMM(dateOrStr) {
  const d = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function fmtDuration(mins) {
  if (mins == null) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function fmtDurationShort(mins) {
  if (mins == null || mins < 0) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function fmtDurationMinsOnly(mins) {
  if (mins == null) return "";
  return `${mins}m`;
}

export function formatScheduleCountdown(secs) {
  if (secs == null || secs < 0) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return mins ? `${h}h ${mins}m` : `${h}h`;
}

export function formatCountdownTo(dueDateStr) {
  if (!dueDateStr) return "";
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return "";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `In ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `In ${h}h ${m}m` : `In ${h}h`;
}

export function stripEmojiFromTitle(str) {
  if (typeof str !== "string") return str ?? "";
  return str
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function taskDurationMins(task) {
  return (task.estimated_blocks || 1) * 25;
}

export function getTasksThatFitGap(tasks, gapMinutes) {
  if (!tasks?.length || gapMinutes < 25) return { suggested: null, top3: [] };
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const fits = (t) => taskDurationMins(t) <= gapMinutes;
  const bySmartScheduler = (a, b) => {
    const aDue = a.due_date ? new Date(a.due_date) : null;
    const bDue = b.due_date ? new Date(b.due_date) : null;
    const aIn48 = aDue && aDue <= in48h;
    const bIn48 = bDue && bDue <= in48h;
    if (aIn48 && !bIn48) return -1;
    if (!aIn48 && bIn48) return 1;
    const aOverdue = aDue && aDue < now;
    const bOverdue = bDue && bDue < now;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (aDue && bDue) return aDue - bDue;
    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
  };
  const filtered = tasks.filter(fits).sort(bySmartScheduler);
  return { suggested: filtered[0] || null, top3: filtered.slice(0, 3) };
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

export function getNextFreeSlotToday(events, selectedDate, durationMins) {
  if (!isToday(selectedDate) || durationMins <= 0) return null;
  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);
  const now = new Date();
  if (now >= dayEnd) return null;
  const dayEvents = (events || [])
    .filter((e) => overlapsDay(new Date(e.start_time), new Date(e.end_time || e.start_time), selectedDate))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  let cursor = Math.max(now.getTime(), dayStart.getTime());
  for (const ev of dayEvents) {
    const evStart = new Date(ev.start_time).getTime();
    const evEnd = new Date(ev.end_time || ev.start_time).getTime();
    if (evStart > cursor) {
      const gapMins = (evStart - cursor) / 60000;
      if (gapMins >= durationMins) {
        return { start: new Date(cursor), end: new Date(cursor + durationMins * 60000) };
      }
    }
    if (evEnd > cursor) cursor = evEnd;
  }
  const remainingMins = (dayEnd.getTime() - cursor) / 60000;
  if (remainingMins >= durationMins) {
    return { start: new Date(cursor), end: new Date(cursor + durationMins * 60000) };
  }
  return null;
}

export function getAllFreeWindowsToday(events, selectedDate) {
  if (!isToday(selectedDate)) return [];
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);
  const now = new Date();
  if (now >= dayEnd) return [];
  const dayEvents = (events || [])
    .filter((e) => overlapsDay(new Date(e.start_time), new Date(e.end_time || e.start_time), selectedDate))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const windows = [];
  let cursor = Math.max(now.getTime(), new Date(selectedDate).setHours(0, 0, 0, 0));
  for (const ev of dayEvents) {
    const evStart = new Date(ev.start_time).getTime();
    const evEnd = new Date(ev.end_time || ev.start_time).getTime();
    if (evStart > cursor) {
      const minutes = Math.round((evStart - cursor) / 60000);
      if (minutes >= 15) {
        windows.push({
          start: new Date(cursor),
          end: new Date(evStart),
          minutes,
        });
      }
    }
    if (evEnd > cursor) cursor = evEnd;
  }
  const remainingMins = Math.round((dayEnd.getTime() - cursor) / 60000);
  if (remainingMins >= 15) {
    windows.push({
      start: new Date(cursor),
      end: new Date(cursor + remainingMins * 60000),
      minutes: remainingMins,
    });
  }
  return windows;
}

export function getPeakHours(heatmap) {
  if (!heatmap?.data || !Array.isArray(heatmap.data)) return [];
  const hourTotals = Array(24).fill(0);
  for (const dayRow of heatmap.data) {
    for (let h = 0; h < dayRow.length; h++) {
      hourTotals[h] += dayRow[h] || 0;
    }
  }
  return hourTotals
    .map((total, hour) => ({ hour, total }))
    .filter((h) => h.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);
}

export function getUrgencyLevel(deadlines, analyticsProgress) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = (analyticsProgress?.daily_progress || []).find((d) => d.date === todayStr);
  const todayActual = todayEntry?.actual_hours ?? 0;
  const critical = (deadlines || []).some((d) => {
    if (!d.start_due_date) return false;
    const daysLeft = (new Date(d.start_due_date) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft < 3;
  });
  return critical && todayActual < 2 ? "urgent" : "normal";
}

export function getTimeOfDay(date) {
  const d = date instanceof Date ? date : new Date(date);
  const h = d.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function isNightSlot(startTime) {
  if (!startTime) return false;
  const h = new Date(startTime).getHours();
  return h >= 23 || h < 6;
}

export function getDailyEnergyPercent() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(6, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 0, 0, 0);
  if (now < start) return 0;
  if (now > end) return 100;
  const total = end - start;
  const elapsed = now - start;
  return Math.round((elapsed / total) * 100);
}

export function getNowLinePercent(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const now = new Date();
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (now < start || now > end) return null;
  const p = ((now - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, p));
}

// Timeline constants
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
export const PX_PER_HOUR = 80;
export const PX_PER_MIN = PX_PER_HOUR / 60;
export const GAP_CARD_THRESHOLD_MINS = 30;
export const FIXED_ROW_GAP_PX = 4;

export const MINI_TIMELINE_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * PX_PER_HOUR;

export function getSmartWindowLabel(gapStartDate) {
  const d = gapStartDate instanceof Date ? gapStartDate : new Date(gapStartDate);
  const hour = d.getHours() + d.getMinutes() / 60;
  if (hour >= 8 && hour < 11) return { label: "Morning Momentum: Prime for Deep Work. ⚡", variant: "morning" };
  if (hour >= 11 && hour < 15) return { label: "Mid-day Peak: Tackle your big goals. 🏔️", variant: "midday" };
  if (hour >= 17 && hour < 24) return { label: "Evening Calm: Reset and reflect. 🌙", variant: "evening" };
  if (hour >= 5 && hour < 8) return { label: "Early Window: Use intentionally. ⚡", variant: "default" };
  return { label: "Focus Window: Use this time intentionally. ⚡", variant: "default" };
}

export function minsFromDayStart(d, dayStartHour = DAY_START_HOUR) {
  const date = d instanceof Date ? d : new Date(d);
  return date.getHours() * 60 + date.getMinutes() - dayStartHour * 60;
}

export const PRIORITY_COLOURS = {
  urgent: "var(--urgent)",
  high: "var(--study)",
  medium: "var(--personal)",
  low: "var(--neutral)",
};

const STUDY_ACCENT = "#c4a35a";
const LIFE_ACCENT = "#9c8f7e";

export function eventAccentColor(item, matchTask, themeColor) {
  if (matchTask) return PRIORITY_COLOURS[matchTask.priority] || themeColor;
  if (isLecture(item) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/i.test(item.title || "")) return STUDY_ACCENT;
  if (/gym|lunch|dinner|breakfast|run|yoga|walk|coffee|cinema|drinks|meeting|shop|laundry/i.test(item.title || "")) return LIFE_ACCENT;
  return themeColor || "#94A3B8";
}

export function scheduleCardBorderColor(item, matchTask) {
  if (matchTask?.priority === "urgent" || /deadline|urgent|due|submission/i.test(item.title || "")) return "#E85555";
  if (isLecture(item) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/i.test(item.title || "")) return "#3B82F6";
  if (/gym|run|yoga|walk|sport|exercise/i.test(item.title || "")) return "#22C897";
  if (/breakfast|lunch|dinner|coffee|meal|sleep|personal|admin|cinema|drinks|meeting|shop|laundry/i.test(item.title || "")) return "#6B7280";
  return "#6B7280";
}

export function spinePillBorderColor(item) {
  const t = (item.title || "").toLowerCase();
  const tag = (item.tag_name ?? item.tag ?? "").toString().toLowerCase();
  if (isLecture(item) || /academic|study|lecture|seminar|tutorial|exam|coursework/.test(tag) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/.test(t)) return "var(--color-sage-primary)";
  if (isRoutineEvent(item) || /breakfast|lunch|dinner|sleep|coffee|meal|routine|wellness/.test(t) || /routine|wellness/.test(tag)) return "#6B7280";
  return "#4f46e5";
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

export function groupOverlaps(sortedItems) {
  const groups = [];
  let current = [];
  let clusterEnd = null;
  for (const item of sortedItems) {
    const start = new Date(item.start_time);
    const end = new Date(item.end_time || item.start_time);
    if (current.length === 0 || start < clusterEnd) {
      current.push(item);
      if (!clusterEnd || end > clusterEnd) clusterEnd = end;
    } else {
      groups.push(current.length === 1 ? { type: "single", item: current[0] } : { type: "cluster", items: current });
      current = [item];
      clusterEnd = end;
    }
  }
  if (current.length > 0) {
    groups.push(current.length === 1 ? { type: "single", item: current[0] } : { type: "cluster", items: current });
  }
  return groups;
}

export function computeTimelineWithGaps(sortedItems, pendingTasks) {
  const grouped = groupOverlaps(sortedItems);
  const result = [];
  for (let i = 0; i < grouped.length; i++) {
    const g = grouped[i];
    result.push(g.type === "cluster" ? { type: "cluster", items: g.items } : { type: "item", data: g.item });
    if (i < grouped.length - 1) {
      const lastItem = g.type === "cluster" ? g.items[g.items.length - 1] : g.item;
      const curEnd = new Date(lastItem.end_time || lastItem.start_time);
      const nextGroup = grouped[i + 1];
      const firstNext = nextGroup.type === "cluster" ? nextGroup.items[0] : nextGroup.item;
      const nextStart = new Date(firstNext.start_time);
      const gapMins = Math.round((nextStart - curEnd) / 60000);
      if (gapMins >= 30) {
        const fits = (t) => ((t.estimated_blocks || 1) * 25) <= gapMins;
        const suggestedTask = pendingTasks.find(fits) || pendingTasks[0] || null;
        const isQuickWin = gapMins >= 30 && gapMins < 60;
        result.push({ type: "gap", minutes: gapMins, gapStart: curEnd, suggestedTask, isQuickWin });
      }
    }
  }
  return result;
}
