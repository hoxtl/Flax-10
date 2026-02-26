import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, CalendarClock } from "lucide-react";

import { isToday, overlapsDay } from "../../components/Calendar/utils/dateUtils";
import {
  useCalendar,
  useCalendarDispatch,
  useEventModal,
} from "../../context/CalendarContext";
import {
  useCalendarEvents,
  useEventActions,
} from "../../components/Calendar/hooks/useCalendarEvents";
import { fetchTasks, updateTask, createTask, fetchTaskLists, createTaskList, deleteTask } from "../../api/taskService";
import { useTags } from "../../context/TagContext";
import { extractBaseEventId } from "../../components/Calendar/utils/eventUtils";
import { getModules, getEnrollments } from "../../api/moduleApi";
import { getUpcomingDeadlines } from "../../api/deadlineApi";
import { isEnrolledIn } from "../../components/Modules/utils/moduleUtils";
import { useTimerContext } from "../../context/TimerContext";
import { useHarvestCelebration } from "../../context/HarvestCelebrationContext";
import { getHarvestMessage, isRoutineHarvestTask } from "../../lib/harvestMessages";
import { getGardenStatus, getLevelUpThresholdCrossed, getLevelUpMessageForThreshold, getSaplingCelebrationCrossed, getSaplingCelebrationMessage } from "../../lib/gardenStatus";
import { getSeedsPerDayThisWeek } from "../../lib/weeklySeedCount";
import { playZenChime } from "../../lib/sounds";
import analyticsService from "../../api/analyticsService";

import DateNavigator from "../../components/Homepage/DateNavigator";
import CreateTaskModal from "../Tasks/components/CreateTaskModal";
import { EditTaskModal } from "../Tasks/components/TaskCard";
import DeadlinesWidget from "../../components/Modules/DeadlinesWidget";
import { SeedBurst } from "../../components/HarvestCelebration/SeedBurst";
import { LiquidProgressTank } from "../../components/Homepage/LiquidProgressTank";
import ZenGardenEmptyState from "../../components/ZenGardenEmptyState";

import styles from "./Homepage.module.css";
import { getTaskEmoji } from "../../utils/emojiMapping";

/** Task duration in minutes: estimated_blocks (Pomodoro blocks) × 25. */
function taskDurationMins(task) {
  return (task.estimated_blocks || 1) * 25;
}

/** Returns tasks that fit in gapMinutes (duration <= gap), sorted by urgency. */
function getTasksThatFitGap(tasks, gapMinutes) {
  if (!tasks?.length || gapMinutes < 25) return { suggested: null, top3: [] };
  const now = new Date();
  const fits = (t) => taskDurationMins(t) <= gapMinutes;
  const byUrgency = (a, b) => {
    const aOverdue = a.due_date && new Date(a.due_date) < now;
    const bOverdue = b.due_date && new Date(b.due_date) < now;
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
  };
  const filtered = tasks.filter(fits).sort(byUrgency);
  return { suggested: filtered[0] || null, top3: filtered.slice(0, 3) };
}

/** Remove emoji and other symbols from a string for clean timeline titles. */
function stripEmojiFromTitle(str) {
  if (typeof str !== "string") return str ?? "";
  return str
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const PRIORITY_COLOURS = {
  urgent: "var(--urgent)",
  high:   "var(--study)",
  medium: "var(--personal)",
  low:    "var(--neutral)",
};

/* Unified color language: study = caramel/gold, life = greige */
const STUDY_ACCENT = "#c4a35a";
const LIFE_ACCENT  = "#9c8f7e";
function eventAccentColor(item, matchTask, themeColor) {
  if (matchTask) return PRIORITY_COLOURS[matchTask.priority] || themeColor;
  if (isLecture(item) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/i.test(item.title || "")) return STUDY_ACCENT;
  if (/gym|lunch|dinner|breakfast|run|yoga|walk|coffee|cinema|drinks|meeting|shop|laundry/i.test(item.title || "")) return LIFE_ACCENT;
  return themeColor || "#94A3B8";
}

/**
 * Left border color for timeline cards: red=urgent, blue=study, green=health, grey=meals/personal.
 */
function scheduleCardBorderColor(item, matchTask) {
  if (matchTask?.priority === "urgent" || /deadline|urgent|due|submission/i.test(item.title || "")) return "#E85555";
  if (isLecture(item) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/i.test(item.title || "")) return "#3B82F6";
  if (/gym|run|yoga|walk|sport|exercise/i.test(item.title || "")) return "#22C897";
  if (/breakfast|lunch|dinner|coffee|meal|sleep|personal|admin|cinema|drinks|meeting|shop|laundry/i.test(item.title || "")) return "#6B7280";
  return "#6B7280";
}

/**
 * Spine timeline: 4px left border only. Sage=Academic, Blue=Personal, Grey=Routine.
 */
function spinePillBorderColor(item) {
  const t = (item.title || "").toLowerCase();
  const tag = (item.tag_name ?? item.tag ?? "").toString().toLowerCase();
  if (isLecture(item) || /academic|study|lecture|seminar|tutorial|exam|coursework/.test(tag) || /lecture|seminar|tutorial|revision|study|library|exam|coursework/.test(t)) return "var(--color-sage-primary)";
  if (isRoutineEvent(item) || /breakfast|lunch|dinner|sleep|coffee|meal|routine|wellness/.test(t) || /routine|wellness/.test(tag)) return "#6B7280";
  return "#4f46e5"; /* Blue = Personal */
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** Format seconds as "17m" or "2h 15m" for UPCOMING countdown in NOW widget. */
function formatScheduleCountdown(secs) {
  if (secs == null || secs < 0) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return mins ? `${h}h ${mins}m` : `${h}h`;
}

function fmtDuration(mins) {
  if (mins == null) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** "In 2h 15m" from now to due date (for Action Hub upcoming cards). */
function formatCountdownTo(dueDateStr) {
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

/** Minutes-only for timeline duration pill: "60m", "25m", "90m" */
function fmtDurationMinsOnly(mins) {
  if (mins == null) return "";
  return `${mins}m`;
}

/** Duration for plan timeline card: "1h 30m" or "45m" (no start/end repetition). */
function fmtDurationShort(mins) {
  if (mins == null || mins < 0) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function getTimeOfDay(date) {
  const d = date instanceof Date ? date : new Date(date);
  const h = d.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/** True if the given time falls in the sleep window 23:00–06:00 (for night overlay). */
function isNightSlot(startTime) {
  if (!startTime) return false;
  const h = new Date(startTime).getHours();
  return h >= 23 || h < 6;
}

function getNowBannerIdleMessage({ nextItem, selectedDate, now: nowDate, hasOverdueToday }) {
  const now = nowDate || new Date();
  const h = now.getHours();
  if (h >= 22 || h < 5) {
    if (hasOverdueToday) return "⚠️ You have tasks that need rescheduling.";
    return "Late night focus? Remember to sleep soon. 🌙";
  }
  const timeOfDay = getTimeOfDay(selectedDate);
  if (timeOfDay === "morning" && nextItem) {
    return `🌅 Fresh start — your first block begins at ${formatTime(nextItem.start_time)}`;
  }
  if (timeOfDay === "afternoon") {
    return "☕ Free window — want to tackle a quick win?";
  }
  return "🌱 Garden's quiet. Time to plant tomorrow's goals?";
}

/** Contextual micro-copy when focus is paused (breather state). */
function getGreetingCopy({ sessionsDone, narrative, now, selectedDate }) {
  if (sessionsDone > 0) {
    return `You've crushed ${sessionsDone} session${sessionsDone === 1 ? "" : "s"}! Enjoy your break.`;
  }
  if (narrative?.bestWindowStart && selectedDate && isToday(selectedDate)) {
    const [h, m] = (narrative.bestWindowStart || "").split(":").map(Number);
    if (h != null && !Number.isNaN(h)) {
      const windowStart = new Date(selectedDate);
      windowStart.setHours(h, m || 0, 0, 0);
      const minsToWindow = (windowStart - now) / 60000;
      if (minsToWindow > 0 && minsToWindow <= 15) {
        const timeStr = narrative.bestWindowStart;
        return `Almost at your ${timeStr} deep work window. Ready to start?`;
      }
    }
  }
  return "Focus paused. Ready to harvest more progress?";
}

/** Context-aware motivation header for Plan for the Day. Uses currentTime, totalTasks, completedTasks, lectureCount. */
function getMotivationMessage(currentTime, totalTasks, completedTasks, lectureCount) {
  const hour = currentTime.getHours();
  const isMorning = hour < 12;
  const isEvening = hour >= 18;
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highCompletion = totalTasks > 0 && (pct >= 50 || completedTasks >= 2);

  if (isEvening && highCompletion) {
    return "Great work today. You've tackled the bulk of your schedule. Time for a breather?";
  }
  if (completedTasks > 0) {
    return `${pct}% of your day is complete — ${completedTasks} goal${completedTasks === 1 ? "" : "s"} crushed!`;
  }
  if (lectureCount > 3) {
    return `It's a big academic day with ${lectureCount} lectures. Pace yourself!`;
  }
  if (isMorning) {
    const taskWord = totalTasks === 1 ? "task" : "tasks";
    const lectWord = lectureCount === 1 ? "lecture" : "lectures";
    return `Good morning! You have ${totalTasks} ${taskWord} and ${lectureCount} ${lectWord} today. Let's get started!`;
  }
  if (totalTasks === 0) {
    return "Your garden is clear. Time to plant something?";
  }
  return `You have ${totalTasks} item${totalTasks === 1 ? "" : "s"} today. You've got this!`;
}

function isNow(startStr, endStr) {
  if (!startStr || !endStr) return false;
  const now = new Date();
  return new Date(startStr) <= now && now <= new Date(endStr);
}

/** Percent of "day budget" passed (6am–11pm). 0–100 for Daily Energy bar. */
function getDailyEnergyPercent() {
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

/** Percent through the event (0–100) for the current time; null if not active. */
function getNowLinePercent(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const now = new Date();
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (now < start || now > end) return null;
  const p = ((now - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, p));
}

/** Soft-coaching "vibe" for NOW widget when idle: focus, gap (with duration), or end of day. */
function getNowVibe(now, selectedDate, sortedEvents, isTodayFn) {
  if (!isTodayFn(selectedDate) || !sortedEvents?.length) {
    return { type: "none", message: "Select today to see your flow", icon: null, gapMins: null, nextItem: null };
  }
  const currentBlock = sortedEvents.find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time));
  if (currentBlock) {
    const title = currentBlock.title?.trim() || "Focus";
    const afterNow = sortedEvents
      .filter((e) => e.start_time && new Date(e.start_time).getTime() > now.getTime())
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return {
      type: "focus",
      message: `Current Focus: ${title}. You've got this! 🌊`,
      icon: "🌊",
      gapMins: null,
      nextItem: afterNow[0] ?? null,
    };
  }
  const future = sortedEvents
    .filter((e) => e.start_time && new Date(e.start_time).getTime() > now.getTime())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const nextItem = future[0] ?? null;
  if (!nextItem) {
    return {
      type: "endOfDay",
      message: "The sun is setting on your tasks. Rest well, your garden is proud of you. 🌙",
      icon: "🌙",
      gapMins: null,
      nextItem: null,
    };
  }
  const gapMs = new Date(nextItem.start_time).getTime() - now.getTime();
  const gapMins = Math.floor(gapMs / 60000);
  if (gapMins < 20) {
    return {
      type: "gap",
      message: "A tiny pocket of peace. Time for a quick stretch or a tea refill?",
      icon: "✨",
      gapMins,
      nextItem,
    };
  }
  if (gapMins <= 60) {
    return {
      type: "gap",
      message: "A golden window! Perfect for a 'Quick Win' or a cozy reset.",
      icon: "🌱",
      gapMins,
      nextItem,
    };
  }
  return {
    type: "gap",
    message: "Wide open skies. Time for a deep-work sprint or some well-deserved rest.",
    icon: "☁️",
    gapMins,
    nextItem,
  };
}

/** Context-aware heads-up for NOW hero: analyzes schedule/tasks and returns message + upNext. */
function getNowHeadsUp(now, selectedDate, sortedEvents, isTodayFn) {
  const defaultMessage = "Ready when you are. Your schedule is clear.";
  const defaultUpNext = null;
  if (!isTodayFn(selectedDate) || !sortedEvents?.length) {
    return { message: defaultMessage, upNext: null };
  }
  const future = [...(sortedEvents || [])]
    .filter((e) => e.start_time && new Date(e.start_time).getTime() > now.getTime())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const nextItem = future[0] ?? null;
  const hour = now.getHours();
  const mins = now.getMinutes();
  const nowMins = hour * 60 + mins;

  // Afternoon slump: 2 PM – 4 PM
  if (hour >= 14 && hour < 16) {
    return {
      message: "The mid-day lull is here. Maybe a quick 10-min reset before the next sprint? ☁️",
      upNext: nextItem ? { title: nextItem.title ?? "Block", time: nextItem.start_time } : null,
    };
  }

  // Lecture/Seminar starting in the next hour
  if (nextItem && isLecture(nextItem)) {
    const nextStart = new Date(nextItem.start_time);
    const nextMins = nextStart.getHours() * 60 + nextStart.getMinutes();
    const gapMins = (nextStart.getTime() - now.getTime()) / 60000;
    if (gapMins <= 60 && gapMins >= 0) {
      return {
        message: "Busy lecture ahead! Grab a coffee and get settled. ☕",
        upNext: { title: nextItem.title ?? "Lecture", time: nextItem.start_time },
      };
    }
  }

  // Busy day: more than 5 tasks/lectures
  if (sortedEvents.length > 5) {
    return {
      message: "It's a high-energy day ahead. Ready to tackle the peak? 🏔️",
      upNext: nextItem ? { title: nextItem.title ?? "Block", time: nextItem.start_time } : null,
    };
  }

  // Deep work: 2+ hour gap until next
  if (nextItem) {
    const gapMs = new Date(nextItem.start_time).getTime() - now.getTime();
    const gapMins = gapMs / 60000;
    if (gapMins >= 120) {
      const timeStr = formatTimeHHMM(nextItem.start_time);
      return {
        message: "⚡ Deep Work Peak: You've got a clear window until [TIME]. Let's dive in.",
        timeInMessage: timeStr,
        upNext: { title: nextItem.title ?? "Next", time: nextItem.start_time },
      };
    }
  }

  // Default / end of day
  if (!nextItem) {
    return {
      message: "The sun is setting on your tasks. Rest well — your garden is proud of you. 🌙",
      upNext: null,
    };
  }

  return {
    message: defaultMessage,
    upNext: nextItem ? { title: nextItem.title ?? "Block", time: nextItem.start_time } : null,
  };
}

function isPast(endStr) {
  if (!endStr) return false;
  return new Date(endStr) < new Date();
}

/** Next free slot today that fits durationMins; returns { start, end } or null. Only for selected date = today. */
function getNextFreeSlotToday(events, selectedDate, durationMins) {
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

/**
 * All free windows (gaps) from now to end of day. Used for Smart Re-plan.
 * Returns [{ start: Date, end: Date, minutes: number }, ...] sorted by start.
 */
function getAllFreeWindowsToday(events, selectedDate) {
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

function isLecture(item) {
  const t = (item.title || "").toLowerCase();
  return t.includes("lecture") || t.includes("seminar") || t.includes("tutorial") || item.source === "timetable";
}

/** Format time as HH:MM for display */
function formatTimeHHMM(dateOrStr) {
  const d = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Compute daily narrative: day type, session count, best window for deep work (longest free gap).
 * Uses selected date and sorted events for that day.
 */
function getDailyNarrative(selectedDate, sortedEvents) {
  const dayStart = new Date(selectedDate);
  dayStart.setHours(8, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(22, 0, 0, 0);
  const lectureCount = (sortedEvents || []).filter(isLecture).length;
  const sessionCount = (sortedEvents || []).length;
  const dayType =
    lectureCount >= 3 ? "Lecture Heavy" : lectureCount >= 1 ? "Moderate" : sessionCount > 0 ? "Busy" : "Free";

  let bestWindowStart = null;
  let bestWindowEnd = null;
  let bestMinutes = 0;

  const events = [...(sortedEvents || [])].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayEnd.getTime();

  if (events.length === 0) {
    bestWindowStart = dayStart;
    bestWindowEnd = dayEnd;
    bestMinutes = (dayEndMs - dayStartMs) / 60000;
  } else {
    const firstStart = new Date(events[0].start_time).getTime();
    if (firstStart > dayStartMs) {
      const mins = (firstStart - dayStartMs) / 60000;
      if (mins >= 60 && mins > bestMinutes) {
        bestMinutes = mins;
        bestWindowStart = new Date(dayStartMs);
        bestWindowEnd = new Date(firstStart);
      }
    }
    for (let i = 0; i < events.length - 1; i++) {
      const end1 = new Date(events[i].end_time || events[i].start_time).getTime();
      const start2 = new Date(events[i + 1].start_time).getTime();
      const gapMins = (start2 - end1) / 60000;
      if (gapMins >= 60 && gapMins > bestMinutes) {
        bestMinutes = gapMins;
        bestWindowStart = new Date(end1);
        bestWindowEnd = new Date(start2);
      }
    }
    const lastEnd = new Date(events[events.length - 1].end_time || events[events.length - 1].start_time).getTime();
    if (dayEndMs > lastEnd) {
      const mins = (dayEndMs - lastEnd) / 60000;
      if (mins >= 60 && mins > bestMinutes) {
        bestMinutes = mins;
        bestWindowStart = new Date(lastEnd);
        bestWindowEnd = new Date(dayEndMs);
      }
    }
  }

  return {
    dayType,
    sessionCount,
    lectureCount,
    bestWindowStart: bestWindowStart ? formatTimeHHMM(bestWindowStart) : null,
    bestWindowEnd: bestWindowEnd ? formatTimeHHMM(bestWindowEnd) : null,
  };
}

function extractModuleCode(str) {
  const match = (str || "").match(/\b([A-Z]{2,3}\d{4})\b/);
  return match ? match[1] : null;
}

function resolveEventIcon(event, tagIcon) {
  const t   = (event.title || "").toLowerCase();
  const src = (event.source || "").toLowerCase();
  // Meals
  if (t === "breakfast")                                        return "🌅";
  if (t === "lunch")                                            return "🥗";
  if (t === "dinner")                                           return "🍽️";
  // Academic
  if (t.includes("lecture") || t.includes("seminar") || t.includes("tutorial")) return "📖";
  if (t.includes("practical") || t.includes("lab"))            return "🔬";
  if (t.includes("workshop"))                                   return "🛠️";
  if (t.includes("exam") || t.includes("test"))                return "📝";
  if (t.includes("submission") || t.includes("coursework"))    return "📤";
  if (t.includes("revision") || t.includes("study"))           return "📚";
  if (t.includes("library"))                                    return "📚";
  if (t.includes("group project") || t.includes("group meeting")) return "🤝";
  if (t.includes("presentation") || t.includes("seminar"))     return "🎤";
  // Health
  if (t.includes("dentist"))                                    return "🦷";
  if (t.includes("gp") || t.includes("doctor"))                return "🩺";
  if (t.includes("appointment"))                                return "📋";
  if (t.includes("gym") || t.includes("basketball") || t.includes("sport")) return "🏋️";
  if (t.includes("run") || t.includes("jog"))                  return "🏃";
  if (t.includes("yoga") || t.includes("stretch") || t.includes("meditat")) return "🧘";
  if (t.includes("walk"))                                       return "🚶";
  // Social / life
  if (t.includes("coffee") || t.includes("costa") || t.includes("pret")) return "☕";
  if (t.includes("brunch"))                                     return "🍳";
  if (t.includes("drinks") || t.includes("pub"))                return "🍻";
  if (t.includes("dinner") || t.includes("restaurant"))        return "🍽️";
  if (t.includes("birthday"))                                   return "🎂";
  if (t.includes("cinema") || t.includes("movie"))             return "🎬";
  if (t.includes("facetime") || t.includes("call") || t.includes("phone")) return "📞";
  if (t.includes("meeting"))                                    return "🤝";
  // Errands / admin
  if (t.includes("email") || t.includes("reply"))              return tagIcon && tagIcon !== "📅" ? tagIcon : "📧";
  if (t.includes("shop") || t.includes("tesco") || t.includes("lidl") || t.includes("grocery")) return "🛒";
  if (t.includes("laundry") || t.includes("clean") || t.includes("tidy")) return "🧹";
  if (t.includes("parcel") || t.includes("inpost") || t.includes("delivery")) return "📦";
  if (t.includes("haircut") || t.includes("barber"))           return "✂️";
  if (t.includes("train") || t.includes("travel") || t.includes("journey")) return "🚆";
  if (t.includes("rent") || t.includes("bills") || t.includes("finance")) return "💸";
  if (t.includes("ikea"))                                       return "🪑";
  // Default — use tag icon if meaningful, else calendar
  if (src === "timetable")                                      return "📖";
  if (tagIcon && tagIcon !== "📅")                              return tagIcon;
  return "📅";
}

/* Group overlapping events into clusters, then interleave gaps */
function groupOverlaps(sortedItems) {
  const groups = [];
  let current  = [];
  let clusterEnd = null;

  for (const item of sortedItems) {
    const start = new Date(item.start_time);
    const end   = new Date(item.end_time || item.start_time);
    if (current.length === 0 || start < clusterEnd) {
      current.push(item);
      if (!clusterEnd || end > clusterEnd) clusterEnd = end;
    } else {
      groups.push(current.length === 1 ? { type: "single", item: current[0] } : { type: "cluster", items: current });
      current    = [item];
      clusterEnd = end;
    }
  }
  if (current.length > 0) {
    groups.push(current.length === 1 ? { type: "single", item: current[0] } : { type: "cluster", items: current });
  }
  return groups;
}

function computeTimelineWithGaps(sortedItems, pendingTasks) {
  const grouped = groupOverlaps(sortedItems);
  const result  = [];

  for (let i = 0; i < grouped.length; i++) {
    const g = grouped[i];
    result.push(g.type === "cluster" ? { type: "cluster", items: g.items } : { type: "item", data: g.item });

    if (i < grouped.length - 1) {
      const lastItem  = g.type === "cluster" ? g.items[g.items.length - 1] : g.item;
      const curEnd    = new Date(lastItem.end_time || lastItem.start_time);
      const nextGroup = grouped[i + 1];
      const firstNext = nextGroup.type === "cluster" ? nextGroup.items[0] : nextGroup.item;
      const nextStart = new Date(firstNext.start_time);
      const gapMins   = Math.round((nextStart - curEnd) / 60000);
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

/* Live progress: circular "Liquid Progress Tank" — sage green liquid, double wave, data-driven level, overlay text, splash on task complete */
function GrowthTank({ completed = 0, total = 0, goalsCrushed: goalsCrushedProp }) {
  const prevCompletedRef = useRef(completed);
  const [splash, setSplash] = useState(false);

  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const displayPct = Math.max(0, pct);
  const goalsDisplay = goalsCrushedProp != null ? goalsCrushedProp : completed;

  useEffect(() => {
    if (completed > prevCompletedRef.current) {
      setSplash(true);
      const t = setTimeout(() => setSplash(false), 1200);
      prevCompletedRef.current = completed;
      return () => clearTimeout(t);
    }
    prevCompletedRef.current = completed;
  }, [completed]);

  return (
    <div
      className={`${styles.growthTankWrap} ${splash ? styles.growthTankSplash : ""}`}
      title={total ? `${completed} of ${total} tasks done — ${displayPct}%` : "No tasks today"}
      role="img"
      aria-label={total ? `Progress: ${displayPct}% complete, ${goalsDisplay} goals crushed` : "No tasks today"}
    >
      <div className={styles.growthTank}>
        <div
          className={styles.growthTankLiquid}
          style={{ height: `${displayPct}%` }}
        >
          {/* Double wave is done via ::before and ::after on .growthTankLiquid */}
        </div>
        {splash && (
          <>
            <span className={styles.growthTankBubble} style={{ "--bub-x": "12px", left: "30%", top: "50%" }} aria-hidden />
            <span className={styles.growthTankBubble} style={{ "--bub-x": "-10px", left: "55%", top: "55%" }} aria-hidden />
            <span className={styles.growthTankBubble} style={{ "--bub-x": "6px", left: "45%", top: "48%" }} aria-hidden />
          </>
        )}
        <div className={styles.growthTankOverlay}>
          <span className={styles.growthTankPct}>{total ? `${displayPct}%` : "—"}</span>
          <span className={styles.growthTankGoals}>{goalsDisplay} Goals Crushed</span>
        </div>
      </div>
    </div>
  );
}

/* Daily progress ring: percentage of today's scheduled items completed (past events / total) — kept for non-today or fallback */
function DailyProgressRing({ dayEvents }) {
  const { completed, total, pct } = useMemo(() => {
    const totalCount = dayEvents.length;
    const completedCount = dayEvents.filter((e) => isPast(e.end_time)).length;
    const value = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
    return { completed: completedCount, total: totalCount, pct: value };
  }, [dayEvents]);

  const r = 22;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className={styles.progressRingWrap} title={`${completed} of ${total} done today`}>
      <svg className={styles.progressRingSvg} viewBox="0 0 52 52" aria-hidden>
        <circle
          className={styles.progressRingBg}
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="4"
        />
        <circle
          className={styles.progressRingFill}
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
        />
      </svg>
      <span className={styles.progressRingLabel}>{total ? `${pct}%` : "—"}</span>
    </div>
  );
}

/* Executive Now & Next Action Card: large high-contrast hero at top with countdown */
function ExecutiveNowNextCard({
  dayEvents,
  selectedDate,
  now: nowProp,
  hasOverdueToday,
  overdueCount = 0,
  oldestOverdueTask,
  onQuickStart,
}) {
  const nowItem = useMemo(
    () => (dayEvents || []).find((e) => isNow(e.start_time, e.end_time)),
    [dayEvents]
  );
  const nextItem = useMemo(() => {
    const nowMs = nowProp.getTime();
    const sorted = [...(dayEvents || [])].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return sorted.find((e) => e.id !== nowItem?.id && new Date(e.start_time).getTime() > nowMs) ?? null;
  }, [dayEvents, nowProp, nowItem]);

  const [countdownSecs, setCountdownSecs] = useState(null);
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      if (nowItem) {
        const end = new Date(nowItem.end_time || nowItem.start_time);
        const rem = Math.max(0, Math.round((end - n) / 1000));
        setCountdownSecs(rem);
        return;
      }
      if (nextItem) {
        const start = new Date(nextItem.start_time);
        const rem = Math.max(0, Math.round((start - n) / 1000));
        setCountdownSecs(rem);
        return;
      }
      setCountdownSecs(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nowItem, nextItem]);

  const hasActiveNow = !!nowItem;
  const inFreeWindow = !hasActiveNow && isToday(selectedDate);
  const showGapPrompt = inFreeWindow && overdueCount > 0;
  const idleMessage = useMemo(
    () =>
      showGapPrompt
        ? `Gap detected! You have ${overdueCount} overdue task${overdueCount === 1 ? "" : "s"}—want to tackle one now?`
        : getNowBannerIdleMessage({ nextItem, selectedDate, now: nowProp, hasOverdueToday }),
    [showGapPrompt, overdueCount, nextItem, selectedDate, nowProp, hasOverdueToday]
  );
  const nowTitle = hasActiveNow ? nowItem.title : idleMessage;
  const nextText = nextItem
    ? `${nextItem.title} at ${formatTime(nextItem.start_time)}`
    : "Nothing else today—time to rest! 🪴";

  const mm = countdownSecs != null ? Math.floor(countdownSecs / 60) : null;
  const ss = countdownSecs != null ? countdownSecs % 60 : null;
  const countdownStr = mm != null ? `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : "—";

  return (
    <div className={styles.executiveActionCard}>
      <div className={styles.executiveActionCardNow}>
        <span className={styles.executiveActionCardNowLabel}>NOW</span>
        <h2 className={styles.executiveActionCardNowTitle}>{nowTitle}</h2>
        {showGapPrompt && oldestOverdueTask && onQuickStart && (
          <button
            type="button"
            className={styles.nowQuickStartBtn}
            onClick={() => onQuickStart(oldestOverdueTask)}
          >
            Quick Start
          </button>
        )}
        <span className={styles.executiveActionCardCountdown} aria-live="polite">{countdownStr}</span>
      </div>
      <div className={styles.executiveActionCardNext}>
        <span className={styles.executiveActionCardNextLabel}>UP NEXT</span>
        <span className={styles.executiveActionCardNextText}>{nextText}</span>
      </div>
    </div>
  );
}

/* Now & Next slim banner: NOW = current block, UP NEXT = first block that *starts* after now */
function NowNextCard({ dayEvents, upcomingItems, selectedDate, now: nowProp, hasOverdueToday = false, isLateNight = false, taskProgress = null }) {
  const nowItem = useMemo(
    () => dayEvents.find((e) => isNow(e.start_time, e.end_time)),
    [dayEvents]
  );
  const nextItem = useMemo(() => {
    const nowMs = nowProp.getTime();
    const sorted = [...dayEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return sorted.find((e) => e.id !== nowItem?.id && new Date(e.start_time).getTime() > nowMs) ?? null;
  }, [dayEvents, nowProp, nowItem]);
  const nextText = nextItem
    ? `${nextItem.title} at ${formatTime(nextItem.start_time)}`
    : "Nothing else today—time to rest! 🪴";

  const hasActiveNow = !!nowItem;
  const idleMessage = useMemo(
    () => getNowBannerIdleMessage({ nextItem, selectedDate, now: nowProp, hasOverdueToday }),
    [nextItem, selectedDate, nowProp, hasOverdueToday]
  );

  const completed = taskProgress?.crushed ?? 0;
  const total = taskProgress?.total ?? 0;

  return (
    <div
      className={`${styles.nowNextBanner} ${hasActiveNow ? styles.nowNextBannerActive : styles.nowNextBannerIdle} ${isLateNight ? styles.nowNextBannerNight : ""}`}
    >
      <GrowthTank completed={completed} total={total} goalsCrushed={completed} />
      <span className={styles.nowNextSep}>·</span>
      <span className={styles.nowNextPart}>
        <span className={styles.nowNextLabel}>NOW:</span>{" "}
        {hasActiveNow ? (
          <span className={styles.nowNextCurrent}>{nowItem.title}</span>
        ) : (
          <span className={styles.nowNextIdle}>{idleMessage}</span>
        )}
      </span>
      <span className={styles.nowNextSep}>·</span>
      <span className={styles.nowNextPart}>
        <span className={styles.nowNextLabel}>UP NEXT:</span> {nextText}
      </span>
    </div>
  );
}

/* Daily Narrative Hero: context-aware summary + Start Session */
function DailyNarrativeHero({ narrative, mostUrgentDeadline, onStartSession, isLateNight }) {
  const { dayType, sessionCount, bestWindowStart, bestWindowEnd } = narrative || {};
  const hasWindow = bestWindowStart && bestWindowEnd;

  if (isLateNight) {
    return (
      <div className={styles.dailyNarrativeHero}>
        <div className={styles.dailyNarrativeStrategyHeader}>
          <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
          Strategy for Today
        </div>
        <div className={styles.dailyNarrativeBox}>
          <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
          <p className={styles.dailyNarrativeText}>
            Late night focus? Remember to sleep soon. 🌙
          </p>
        </div>
        <button
          type="button"
          className={styles.dailyNarrativeBtn}
          onClick={() => onStartSession?.(mostUrgentDeadline)}
          aria-label={mostUrgentDeadline ? `Start session for ${mostUrgentDeadline.title}` : "Start focus session"}
        >
          Start Session
        </button>
      </div>
    );
  }

  if (sessionCount > 0 && hasWindow) {
    return (
      <div className={styles.dailyNarrativeHero}>
        <div className={styles.dailyNarrativeStrategyHeader}>
          <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
          Strategy for Today
        </div>
        <div className={styles.dailyNarrativeBox}>
          <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
          <p className={styles.dailyNarrativeText}>
            Today is a <span className={styles.dailyNarrativeBold}>{dayType}</span> day with{" "}
            <span className={styles.dailyNarrativeBold}>{sessionCount} session{sessionCount === 1 ? "" : "s"}</span>.
            Your best window for deep work is between{" "}
            <span className={styles.dailyNarrativeBold}>{bestWindowStart} and {bestWindowEnd}</span>.
          </p>
        </div>
        <button
          type="button"
          className={styles.dailyNarrativeBtn}
          onClick={() => onStartSession?.(mostUrgentDeadline)}
          aria-label={mostUrgentDeadline ? `Start session for ${mostUrgentDeadline.title}` : "Start focus session"}
        >
          Start Session
        </button>
      </div>
    );
  }

  const line1 = sessionCount > 0
    ? `Today is a ${dayType} day with ${sessionCount} session${sessionCount === 1 ? "" : "s"}.`
    : "Your day is clear.";
  const line2 = hasWindow
    ? `Your best window for deep work is between ${bestWindowStart} and ${bestWindowEnd}.`
    : sessionCount > 0
      ? "Snatch short lists between sessions."
      : "A good time to plan or tackle your tasks.";
  const greetingText = `${line1} ${line2}`;

  return (
    <div className={styles.dailyNarrativeHero}>
      <div className={styles.dailyNarrativeStrategyHeader}>
        <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
        Strategy for Today
      </div>
      <div className={styles.dailyNarrativeBox}>
        <span className={styles.dailyNarrativeIcon} aria-hidden>💡</span>
        <p className={styles.dailyNarrativeText}>
          {greetingText}
        </p>
      </div>
      <button
        type="button"
        className={styles.dailyNarrativeBtn}
        onClick={() => onStartSession?.(mostUrgentDeadline)}
        aria-label={mostUrgentDeadline ? `Start session for ${mostUrgentDeadline.title}` : "Start focus session"}
      >
        Start Session
      </button>
    </div>
  );
}

/* Data hook */
function useHomeData(selectedDate) {
  const { events } = useCalendar();
  const [allTasks, setAllTasks] = useState([]);
  useCalendarEvents();

  useEffect(() => {
    fetchTasks()
      .then((data) => setAllTasks(data || []))
      .catch(() => {});
  }, []);

  const dayEvents = useMemo(
    () => events.filter((e) => overlapsDay(new Date(e.start_time), new Date(e.end_time), selectedDate)),
    [events, selectedDate]
  );

  const dayTasks = useMemo(() => {
    const incomplete = allTasks.filter((t) => !t.completed);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
    return incomplete
      .filter((t) => t.due_date && new Date(t.due_date) <= dayEnd)
      .sort((a, b) => (p[a.priority] ?? 4) - (p[b.priority] ?? 4));
  }, [allTasks, selectedDate]);

  const removePendingTask = useCallback((id) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refetchTasks = useCallback(() => {
    fetchTasks().then((data) => setAllTasks(data || [])).catch(() => {});
  }, []);

  return { dayEvents, dayTasks, allTasks, removePendingTask, refetchTasks };
}

/* Detail overlay */
function DetailOverlay({ item, icon, accentColor, onClose }) {
  const start        = new Date(item.start_time);
  const end          = item.end_time ? new Date(item.end_time) : null;
  const durationMins = end ? Math.round((end - start) / 60000) : null;
  const active       = isNow(item.start_time, item.end_time);
  const lect         = isLecture(item);
  const modCode      = lect ? (item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description)) : null;

  return (
    <div className={styles.overlayBackdrop} onMouseDown={onClose}>
      <div className={styles.detailCard} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.detailTop} style={{ background: `${accentColor}14` }}>
          <div className={styles.detailIconLarge} style={{ background: `${accentColor}22` }}>{icon}</div>
          <div className={styles.detailTopText}>
            <div className={styles.detailMeta}>
              {active && <span className={styles.nowPill}>Now</span>}
              <span className={styles.detailTime}>
                {formatTime(item.start_time)}{end ? ` – ${formatTime(item.end_time)}` : ""}
              </span>
              {durationMins > 0 && <span className={styles.detailDur}>{fmtDuration(durationMins)}</span>}
            </div>
            <h2 className={styles.detailTitle}>{item.title}</h2>
          </div>
          <button className={styles.detailClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.detailBody}>
          {lect && (modCode || item.description) && (
            <div className={styles.detailRow}>
              <span className={styles.detailRowLabel}>Module</span>
              <span className={styles.detailRowText}>
                {modCode && <strong>{modCode}</strong>}
                {modCode && item.description && " · "}
                {item.description}
              </span>
            </div>
          )}
          {!lect && item.description && (
            <div className={styles.detailRow}>
              <span className={styles.detailRowLabel}>Notes</span>
              <span className={styles.detailRowText}>{item.description}</span>
            </div>
          )}
          {item.location && (
            <div className={styles.detailRow}>
              <span className={styles.detailRowLabel}>Where</span>
              <span className={styles.detailRowText}>{item.location}</span>
            </div>
          )}
          {!item.description && !item.location && (
            <p className={styles.detailEmpty}>No additional details.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* Small monochromatic icons for context menu */
const IconPencil = () => (
  <svg className={styles.contextIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
);
const IconTrash = () => (
  <svg className={styles.contextIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);

/* Context menu — clean dropdown with blur */
function ContextMenu({ x, y, item, onEdit, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className={styles.contextMenu} style={{ top: y, left: x }} role="menu">
      <button type="button" role="menuitem" className={styles.contextItem} onClick={() => { onEdit(item); onClose(); }}>
        <IconPencil /> Edit
      </button>
      <div className={styles.contextDivider} />
      <button type="button" role="menuitem" className={`${styles.contextItem} ${styles.contextDelete}`} onClick={() => { onDelete(item.id); onClose(); }}>
        <IconTrash /> Delete
      </button>
    </div>
  );
}

/* Timeline event card */
const SYSTEM_EVENT_SOURCES_OVERDUE = ["module_deadline", "module_enrollment"];

function isRoutineEvent(item) {
  const title = (item?.title || "").toLowerCase();
  const tagName = (item?.tag_name ?? item?.tag?.name ?? "").toString().toLowerCase();
  if (tagName === "routine" || tagName === "wellness") return true;
  return /breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack|commute/i.test(title);
}

/** Event is major academic/work (lecture, seminar, meeting) — only these go in Action Hub. */
function isMajorAcademicOrWorkEvent(item) {
  if (!item) return false;
  if (isRoutineEvent(item)) return false;
  const title = (item?.title || "").toLowerCase();
  const tagName = (item?.tag_name ?? item?.tag?.name ?? "").toString().toLowerCase();
  return /lecture|seminar|meeting|exam|tutorial|lab\s*session|class/i.test(title) || /lecture|seminar|meeting|academic|exam/i.test(tagName);
}

/** Task is routine (meals/sleep) or event-like (lecture/seminar/tutorial) — auto-pass when time has passed, no overdue. */
function isRoutineOrEventTask(task, getTag) {
  if (!task) return false;
  const title = (task.title || "").toLowerCase();
  const tagLabel = (getTag && getTag(task.tag)?.label) || (task.tag_name || "").toString();
  const tagLower = tagLabel.toLowerCase();
  if (tagLower === "routine" || tagLower === "wellness" || tagLower === "event") return true;
  if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack|commute/i.test(title)) return true;
  if (/lecture|seminar|tutorial|lab\s*session/i.test(title)) return true;
  return false;
}

/** Seeds by category for Growth by Category: completed only, excluding routine. Academic = tag === 'Academic', Personal = tag === 'Personal'. */
function calculateSeedsByCategory(tasks, getTag) {
  const completed = (tasks || []).filter((t) => t.completed && !isRoutineOrEventTask(t, getTag));
  let academic = 0;
  let personal = 0;
  completed.forEach((t) => {
    const label = (getTag && getTag(t.tag)?.label) || (t.tag_name || "").toString();
    if (/academic|study|lecture|exam|coursework/i.test(label)) academic += 1;
    else personal += 1;
  });
  return { academic, personal };
}

/** True if task is routine/event and its due time has passed — treat as "done" without user checking. */
function isAutoPassedTask(task, now = new Date(), getTag) {
  if (!isRoutineOrEventTask(task, getTag) || !task.due_date) return false;
  return new Date(task.due_date) < now;
}

function TimelineRow({ item, isFirst, isLast, onDelete, onEdit, onReschedule, dayTasks, asPastBar }) {
  const { getTag }          = useTags();
  const [showDetail, setShowDetail] = useState(false);
  const [ctxMenu, setCtxMenu]       = useState(null);
  const [rescheduling, setRescheduling] = useState(false);

  const theme       = getTag(item.tag) || { color: "#94A3B8", icon: "📅" };
  const icon        = resolveEventIcon(item, theme.icon);
  const durationMins = item.end_time
    ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 60000)
    : null;
  const matchTask   = dayTasks?.find((t) => (t.title || "").trim() === (item.title || "").trim());
  const accentColor = eventAccentColor(item, matchTask, theme.color);
  const borderColor = scheduleCardBorderColor(item, matchTask);
  const active      = isNow(item.start_time, item.end_time);
  const past        = !active && isPast(item.end_time);
  const routine     = isRoutineEvent(item);
  /* Events (calendar) never show as Overdue — they just dim when time has passed. Only tasks (harvest list) can be overdue. */
  const isOverdue   = false;
  const lect        = isLecture(item);
  const modCode     = lect ? (item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description)) : null;
  const startTime   = formatTime(item.start_time);
  const endTime     = formatTime(item.end_time);

  const cardHeight = durationMins != null ? Math.max(40, Math.min(180, Math.round(durationMins * 1.8))) : undefined;

  const nightSlot = isNightSlot(item.start_time);

  const actionBtnRef = useRef(null);
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);
  const openActionMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionBtnRef.current) {
      const rect = actionBtnRef.current.getBoundingClientRect();
      setCtxMenu({ x: rect.left, y: rect.bottom + 4 });
    }
  }, []);

  const isThinBar = (asPastBar || past) && !isOverdue;
  const rowPastDim = past && routine;
  const startHour = item.start_time ? new Date(item.start_time).getHours() : 12;
  const timeOfDayClass = startHour < 12 ? styles.timeOfDayMorning : startHour >= 17 ? styles.timeOfDayEvening : null;
  const nowLineTop = active ? getNowLinePercent(item.start_time, item.end_time) : null;
  const tagLower = (item.tag || "").toString().toLowerCase();
  const categoryClass =
    /academic|study|lecture|seminar|tutorial|exam|coursework/.test(tagLower) ? styles.cardCategoryAcademic
    : /personal|life|wellbeing/.test(tagLower) ? styles.cardCategoryPersonal
    : /admin|misc|other/.test(tagLower) ? styles.cardCategoryAdmin
    : null;

  return (
    <>
      <div className={`${styles.timelineRow} ${past ? styles.rowPast : ""} ${rowPastDim ? styles.rowPastRoutine : ""} ${isThinBar ? styles.rowThinBar : ""} ${nightSlot ? styles.nightSlot : ""} ${isOverdue ? styles.rowOverdue : ""}`}>
        <div className={styles.gutter}>
          <span className={styles.gutterTime}>{startTime}</span>
          {durationMins > 0 && <span className={styles.gutterDur}>{fmtDuration(durationMins)}</span>}
        </div>

        {isThinBar ? (
          <div
            className={styles.pastBar}
            style={{ background: `linear-gradient(90deg, ${accentColor}40, ${accentColor}15)` }}
            onClick={() => setShowDetail(true)}
            onContextMenu={handleContextMenu}
            title={item.title}
          />
        ) : (
          <div
            className={`${styles.card} ${active ? styles.cardActive : ""} ${isOverdue ? styles.cardOverdue : ""} ${timeOfDayClass || ""} ${categoryClass || ""} ${styles.cardWithNowLine}`}
            style={{
              "--card-accent": borderColor,
              minHeight: cardHeight ? `${cardHeight}px` : undefined,
              "--now-line-top": nowLineTop != null ? `${nowLineTop}%` : undefined,
            }}
            onClick={() => setShowDetail(true)}
            onContextMenu={handleContextMenu}
          >
            {active && nowLineTop != null && (
              <div className={styles.nowIndicatorLine} aria-hidden />
            )}
            <div className={styles.cardIcon} style={{ background: `${accentColor}1A` }}>
              <span className={styles.cardIconEmoji}>{icon}</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardMeta}>
                {active && <span className={styles.nowBadge}>Now</span>}
                {isOverdue && <span className={styles.overdueBadge}>Overdue</span>}
              </div>
              <span className={styles.cardTitle}>{item.title}</span>
              {lect && modCode && <span className={styles.cardSub}>{modCode}</span>}
              {isOverdue && onReschedule && (
                <button
                  type="button"
                  className={styles.cardRescheduleBtn}
                  disabled={rescheduling}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (rescheduling) return;
                    setRescheduling(true);
                    try {
                      await onReschedule(item);
                    } finally {
                      setRescheduling(false);
                    }
                  }}
                  aria-label="Reschedule"
                >
                  {rescheduling ? "Rescheduling…" : "🔄 Reschedule"}
                </button>
              )}
            </div>
            <div className={styles.cardActionBar}>
              <button
                ref={actionBtnRef}
                type="button"
                className={styles.cardActionBtn}
                onClick={openActionMenu}
                aria-label="Schedule options"
                aria-haspopup="menu"
              >
                <svg className={styles.cardActionKebab} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetail && (
        <DetailOverlay item={item} icon={icon} accentColor={accentColor} onClose={() => setShowDetail(false)} />
      )}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y} item={item}
          onEdit={onEdit} onDelete={onDelete}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}


/* Overlap cluster */
function OverlapCluster({ items, onDelete, onEdit, onApplySuggestion }) {
  const { getTag }      = useTags();
  const [expanded,      setExpanded]      = useState(false);
  const [resolveOpen,   setResolveOpen]   = useState(false);
  const [dismissed,     setDismissed]     = useState(false);
  const firstStart      = formatTime(items[0].start_time);

  const clusterTimeRange = useMemo(() => {
    let minStart = Infinity;
    let maxEnd = -Infinity;
    items.forEach((it) => {
      const s = new Date(it.start_time).getTime();
      const e = new Date(it.end_time || it.start_time).getTime();
      if (s < minStart) minStart = s;
      if (e > maxEnd) maxEnd = e;
    });
    return { start: minStart === Infinity ? null : minStart, end: maxEnd === -Infinity ? null : maxEnd };
  }, [items]);

  const nowLinePercent = useMemo(() => {
    if (!clusterTimeRange.start || !clusterTimeRange.end) return null;
    const now = Date.now();
    if (now < clusterTimeRange.start || now > clusterTimeRange.end) return null;
    return Math.max(0, Math.min(100, ((now - clusterTimeRange.start) / (clusterTimeRange.end - clusterTimeRange.start)) * 100));
  }, [clusterTimeRange]);

  const hasActiveNow = items.some((it) => isNow(it.start_time, it.end_time));

  const nightSlot = isNightSlot(items[0]?.start_time);

  // Build suggested resolution: keep the longest event, reschedule others sequentially after it
  const resolution = useMemo(() => {
    const sorted  = [...items].sort((a, b) => {
      const durA = new Date(a.end_time) - new Date(a.start_time);
      const durB = new Date(b.end_time) - new Date(b.start_time);
      return durB - durA; // longest first
    });
    const keep  = sorted[0];
    const rest  = sorted.slice(1);
    const suggestions = [];
    let cursor = new Date(keep.end_time);
    for (const ev of rest) {
      const dur = new Date(ev.end_time) - new Date(ev.start_time);
      const newStart = new Date(cursor);
      const newEnd   = new Date(cursor.getTime() + dur);
      suggestions.push({
        event: ev,
        suggestedStart: newStart,
        suggestedEnd:   newEnd,
        label: `${formatTime(newStart.toISOString())}–${formatTime(newEnd.toISOString())}`,
      });
      cursor = newEnd;
    }
    return { keep, suggestions };
  }, [items]);

  return (
    <div className={`${styles.clusterRow} ${nightSlot ? styles.nightSlot : ""}`}>
      <div className={styles.gutter}>
        <span className={styles.gutterTime}>{firstStart}</span>
      </div>

      <div className={styles.clusterCards}>
        {hasActiveNow && nowLinePercent != null && (
          <div
            className={styles.clusterNowLine}
            style={{ top: `${nowLinePercent}%` }}
            aria-hidden
          />
        )}
        {/* Header */}
        <div className={styles.overlapHeader}>
          <div className={styles.overlapBadge}>
            ⚡ {items.length} events overlap
          </div>
          <div className={styles.overlapActions}>
            <button
              className={styles.overlapResolveBtn}
              onClick={() => setResolveOpen(r => !r)}
              title="Resolve overlap"
            >
              {resolveOpen ? "Hide suggestions" : "✨ Resolve"}
            </button>
            <button
              className={styles.overlapExpandBtn}
              onClick={() => setExpanded(e => !e)}
              title="Show events"
            >
              {expanded ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {/* Events list: side-by-side when overlapping */}
        {(expanded || true) && (
          <div className={styles.clusterCardsRow}>
            {items.map((item) => {
              const theme       = getTag(item.tag) || { color: "#94A3B8", icon: "📅" };
              const icon        = resolveEventIcon(item, theme.icon);
              const accentColor = eventAccentColor(item, null, theme.color);
              const borderColor = scheduleCardBorderColor(item, null);
              const durationMins = item.end_time
                ? Math.round((new Date(item.end_time) - new Date(item.start_time)) / 60000)
                : null;
              return (
                <ClusterCard
                  key={item.id}
                  item={item}
                  icon={icon}
                  accentColor={accentColor}
                  borderColor={borderColor}
                  durationMins={durationMins}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              );
            })}
          </div>
        )}

        {/* Resolve panel */}
        {resolveOpen && (
          <div className={styles.resolvePanel}>
            <div className={styles.resolvePanelHeader}>
              <span className={styles.resolvePanelTitle}>✨ Suggested fix</span>
              <span className={styles.resolvePanelSub}>
                Keep <strong>"{resolution.keep.title}"</strong>, reschedule the rest:
              </span>
            </div>
            {resolution.suggestions.map(s => (
              <div key={s.event.id} className={styles.resolveSuggestion}>
                <div className={styles.resolveSuggestLeft}>
                  <span className={styles.resolveName}>{s.event.title}</span>
                  <span className={styles.resolveTime}>{s.label}</span>
                </div>
                <button
                  className={styles.resolveApplyBtn}
                  onClick={() => onApplySuggestion?.(s)}
                >
                  Apply
                </button>
              </div>
            ))}
            <p className={styles.resolvePanelNote}>
              Or right-click any event to edit manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ClusterCard({ item, icon, accentColor, borderColor, durationMins, onDelete, onEdit }) {
  const [showDetail, setShowDetail] = useState(false);
  const [ctxMenu, setCtxMenu]       = useState(null);
  const actionBtnRef = useRef(null);
  const active = isNow(item.start_time, item.end_time);
  const past   = !active && isPast(item.end_time);
  const barColor = borderColor ?? accentColor;

  const openActionMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionBtnRef.current) {
      const rect = actionBtnRef.current.getBoundingClientRect();
      setCtxMenu({ x: rect.left, y: rect.bottom + 4 });
    }
  }, []);

  return (
    <>
      <div
        className={`${styles.card} ${styles.clusterCard} ${past ? styles.cardPast : ""} ${active ? styles.cardActive : ""}`}
        style={{ "--card-accent": barColor }}
        onClick={() => setShowDetail(true)}
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
      >
        <div className={styles.cardIcon} style={{ background: `${accentColor}1A` }}>
          <span className={styles.cardIconEmoji}>{icon}</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>
            {active && <span className={styles.nowBadge}>Now</span>}
          </div>
          <span className={styles.cardTitle}>{item.title}</span>
        </div>
        <div className={styles.cardActionBar}>
          <button
            ref={actionBtnRef}
            type="button"
            className={styles.cardActionBtn}
            onClick={openActionMenu}
            aria-label="Schedule options"
            aria-haspopup="menu"
          >
            <svg className={styles.cardActionKebab} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
          </button>
        </div>
      </div>
      {showDetail && <DetailOverlay item={item} icon={icon} accentColor={accentColor} onClose={() => setShowDetail(false)} />}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} item={item}
          onEdit={onEdit} onDelete={onDelete} onClose={() => setCtxMenu(null)} />
      )}
    </>
  );
}

/* Empty slot: show gutter + "Free Window" label; ghost button "Autofill with Quick Win?" to suggest a short task that fits */
function FreeWindowRow({
  minutes,
  gapStart,
  showFreeWindowLabel,
  suggestedTask,
  addEvent,
  onToast,
  onScheduled,
}) {
  const [scheduling, setScheduling] = useState(false);
  const [hidden, setHidden] = useState(false);

  const handleAutofill = async () => {
    if (!suggestedTask || scheduling) return;
    setScheduling(true);
    try {
      const estMins = (suggestedTask.estimated_blocks || 1) * 25;
      const startTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
      const endTime = new Date(startTime.getTime() + estMins * 60000);
      await addEvent({
        title: suggestedTask.title,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        description: suggestedTask.description || "",
      });
      onScheduled?.();
      onToast?.(`"${suggestedTask.title}" added to your plan`);
      setHidden(true);
    } catch {
      onToast?.("Couldn't add — try again.");
    } finally {
      setScheduling(false);
    }
  };

  const gapStartTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
  const timeStr = formatTime(gapStartTime.toISOString());
  const nightSlot = isNightSlot(gapStartTime);

  if (hidden) return null;

  return (
    <div className={`${styles.freeWindowRow} ${nightSlot ? styles.nightSlot : ""}`}>
      <div className={styles.gutter}>
        <span className={styles.gutterTime}>{timeStr}</span>
        <span className={styles.gutterDur}>{fmtDuration(minutes)}</span>
        {showFreeWindowLabel && <span className={styles.freeWindowLabel}>Free Window</span>}
      </div>
      <div className={styles.freeWindowContent}>
        <button
          type="button"
          className={styles.timelineGapAutofillBtn}
          onClick={handleAutofill}
          disabled={scheduling || !suggestedTask}
          title={
            suggestedTask
              ? `Add "${suggestedTask.title}" (${(suggestedTask.estimated_blocks || 1) * 25}m) here`
              : "No short task fits this slot"
          }
          aria-label={suggestedTask ? `Autofill with quick win: ${suggestedTask.title}` : "No task fits this gap"}
        >
          {scheduling ? "Adding…" : "Autofill with Quick Win?"}
        </button>
      </div>
    </div>
  );
}

/* Quick Win Opportunity card for 30–60 min gaps */
function QuickWinGap({ minutes, gapStart, suggestedTask, onTaskScheduled, addEvent, onToast }) {
  const [scheduling, setScheduling] = useState(false);
  const [hidden, setHidden] = useState(false);

  const shortName = suggestedTask
    ? (suggestedTask.title.length > 32 ? suggestedTask.title.slice(0, 29) + "…" : suggestedTask.title)
    : "a short task";

  const scheduleTask = async () => {
    if (!suggestedTask || scheduling || hidden) return;
    setScheduling(true);
    try {
      const estMins = (suggestedTask.estimated_blocks || 1) * 25;
      const startTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
      const endTime = new Date(startTime.getTime() + estMins * 60000);
      await addEvent({
        title: suggestedTask.title,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        description: suggestedTask.description || "",
      });
      onTaskScheduled?.(suggestedTask.id);
      onToast?.(`"${suggestedTask.title}" added to your plan`);
      setHidden(true);
    } catch {
      onTaskScheduled?.(suggestedTask.id);
      setHidden(true);
    } finally {
      setScheduling(false);
    }
  };

  if (hidden) return null;

  const gapStartTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
  const timeStr = formatTime(gapStartTime.toISOString());
  const nightSlot = isNightSlot(gapStartTime);

  return (
    <div className={`${styles.quickWinRow} ${nightSlot ? styles.nightSlot : ""}`}>
      <div className={styles.gutter}>
        <span className={styles.gutterTime}>{timeStr}</span>
        <span className={styles.gutterDur}>{fmtDuration(minutes)}</span>
      </div>
      <div className={styles.quickWinCard}>
        <p className={styles.quickWinText}>
          🌱 Quick Win Opportunity. Do you want to tackle <strong>{shortName}</strong> here?
        </p>
        <button
          type="button"
          className={styles.quickWinBtn}
          onClick={scheduleTask}
          disabled={scheduling || !suggestedTask}
        >
          {scheduling ? "Adding…" : "Quick Add"}
        </button>
      </div>
    </div>
  );
}

/* Empty slot with Quick Add */
function FreeGap({ minutes, gapStart, suggestedTask, quickAddTasks = [], onTaskScheduled, addEvent, onToast }) {
  const [scheduling, setScheduling] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const menuRef = useRef(null);

  const topTasks = (quickAddTasks && quickAddTasks.length > 0) ? quickAddTasks.slice(0, 3) : (suggestedTask ? [suggestedTask] : []);

  const scheduleTask = async (task) => {
    if (!task || scheduling || hidden) return;
    setScheduling(true);
    try {
      const estMins   = (task.estimated_blocks || 1) * 25;
      const startTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
      const endTime   = new Date(startTime.getTime() + estMins * 60000);
      await addEvent({
        title:       task.title,
        start_time:  startTime.toISOString(),
        end_time:    endTime.toISOString(),
        description: task.description || "",
      });
      onTaskScheduled?.(task.id);
      onToast?.(`"${task.title}" added to your plan`);
      setHidden(true);
      setQuickOpen(false);
    } catch {
      onTaskScheduled?.(task.id);
      setHidden(true);
      setQuickOpen(false);
    } finally {
      setScheduling(false);
    }
  };

  useEffect(() => {
    if (!quickOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setQuickOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [quickOpen]);

  if (hidden) return null;

  const nightSlot = isNightSlot(gapStart);
  const gapStartTime = gapStart instanceof Date ? gapStart : new Date(gapStart);
  const timeStr = formatTime(gapStartTime.toISOString());

  return (
    <div className={`${styles.gapRow} ${nightSlot ? styles.nightSlot : ""}`} ref={menuRef}>
      <div className={styles.gutter}>
        <span className={styles.gutterTime}>{timeStr}</span>
        <span className={styles.gutterDur}>{fmtDuration(minutes)}</span>
      </div>
      <div className={styles.gapAddBlockWrap}>
        <div
          className={styles.gapAddBlockBox}
          onClick={() => setQuickOpen((o) => !o)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setQuickOpen((o) => !o); } }}
          role="button"
          tabIndex={0}
          title={`${fmtDuration(minutes)} free — add task`}
          aria-label="Add block"
        >
          <span className={styles.gapAddBlockLabel}>+ Add Block</span>
        </div>
        {quickOpen && topTasks.length > 0 && (
          <div className={styles.quickAddMenu}>
            <span className={styles.quickAddTitle}>Quick add</span>
            {topTasks.map((t) => (
              <button
                key={t.id}
                type="button"
                className={styles.quickAddItem}
                onClick={() => scheduleTask(t)}
                disabled={scheduling}
              >
                {t.title}
              </button>
            ))}
          </div>
        )}
        {quickOpen && topTasks.length === 0 && (
          <div className={styles.quickAddMenu}>
            <span className={styles.quickAddEmptyIcon} aria-hidden>🪴</span>
            <span className={styles.quickAddEmpty}>No tasks to add</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* High-fidelity Mini-Timeline: 80px hour gutter, duration-based pills, live indicator, Free Window gaps */
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;
const PX_PER_HOUR = 80;
const PX_PER_MIN = PX_PER_HOUR / 60;
const MINI_TIMELINE_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * PX_PER_HOUR;
/** Gaps below this get a thin line; 30+ get the full ghost "Gap Card". */
const GAP_CARD_THRESHOLD_MINS = 30;
/** Vertical px between rows for compact list-style timeline (uniform gap, not duration-scaled). */
const FIXED_ROW_GAP_PX = 4;

/** Smart gap label and variant by time of day. 08:00–11:00 Morning, 11:00–15:00 Mid-day, 17:00+ Evening. */
function getSmartWindowLabel(gapStartDate) {
  const d = gapStartDate instanceof Date ? gapStartDate : new Date(gapStartDate);
  const hour = d.getHours() + d.getMinutes() / 60;
  if (hour >= 8 && hour < 11) return { label: "Morning Momentum: Prime for Deep Work. ⚡", variant: "morning" };
  if (hour >= 11 && hour < 15) return { label: "Mid-day Peak: Tackle your big goals. 🏔️", variant: "midday" };
  if (hour >= 17 && hour < 24) return { label: "Evening Calm: Reset and reflect. 🌙", variant: "evening" };
  if (hour >= 5 && hour < 8) return { label: "Early Window: Use intentionally. ⚡", variant: "default" };
  return { label: "Focus Window: Use this time intentionally. ⚡", variant: "default" };
}

function minsFromDayStart(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.getHours() * 60 + date.getMinutes() - DAY_START_HOUR * 60;
}

function MiniTimeline({
  sortedEvents,
  selectedDate,
  now,
  dayTasks,
  tasksDueToday = [],
  suggestableTasks = [],
  taskLists = [],
  onQuickStart,
  onHarvestToggle,
  onCardClick,
  onEdit,
  onConflictAutoMove,
  onDelete,
  onReschedule,
  getTag,
}) {
  const [conflictPopoverRowId, setConflictPopoverRowId] = useState(null);
  const [slotPopoverRowId, setSlotPopoverRowId] = useState(null);
  const conflictPopoverRef = useRef(null);
  const slotPopoverRef = useRef(null);

  useEffect(() => {
    if (!conflictPopoverRowId) return;
    const handleClickOutside = (e) => {
      if (conflictPopoverRef.current && !conflictPopoverRef.current.contains(e.target)) {
        setConflictPopoverRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [conflictPopoverRowId]);
  useEffect(() => {
    if (!slotPopoverRowId) return;
    const handleClickOutside = (e) => {
      if (slotPopoverRef.current && !slotPopoverRef.current.contains(e.target)) setSlotPopoverRowId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [slotPopoverRowId]);
  const dayStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(DAY_START_HOUR, 0, 0, 0);
    return d;
  }, [selectedDate]);
  const dayEnd = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(DAY_END_HOUR, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const rows = useMemo(() => {
    const inWindow = (sortedEvents || []).filter((e) => {
      const s = new Date(e.start_time).getTime();
      const eEnd = new Date(e.end_time || e.start_time).getTime();
      return eEnd > dayStart.getTime() && s < dayEnd.getTime();
    });
    const entries = [];
    let lastEndMins = null;

    for (let i = 0; i < inWindow.length; i++) {
      const item = inWindow[i];
      const start = new Date(item.start_time);
      const end = new Date(item.end_time || item.start_time);
      const startMins = Math.max(0, (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes());
      const endMins = Math.min((DAY_END_HOUR - DAY_START_HOUR) * 60, (end.getHours() - DAY_START_HOUR) * 60 + end.getMinutes());

      if (lastEndMins != null) {
        const gapMins = startMins - lastEndMins;
        if (gapMins > 0 && gapMins < GAP_CARD_THRESHOLD_MINS) {
          entries.push({
            type: "tinyGap",
            id: `tiny-${i}`,
            startMins: lastEndMins,
            endMins: startMins,
            minutes: startMins - lastEndMins,
          });
        } else if (gapMins >= GAP_CARD_THRESHOLD_MINS) {
          entries.push({
            type: "free",
            id: `free-${i}`,
            startMins: lastEndMins,
            endMins: startMins,
            minutes: startMins - lastEndMins,
            gapStartMins: lastEndMins,
          });
        }
      }

      const isPast = end < now;
      const active = isNow(item.start_time, item.end_time);
      const matchTask = (dayTasks || []).find((t) => (t.title || "").trim() === (item.title || "").trim())
        || (tasksDueToday || []).find((t) => (t.title || "").trim() === (item.title || "").trim());
      const modCode = item.module_code || extractModuleCode(item.title) || extractModuleCode(item.description);
      const isRoutine = isRoutineEvent(item);

      let isOverlap = false;
      for (let j = 0; j < inWindow.length; j++) {
        if (j === i) continue;
        const other = inWindow[j];
        const oStart = new Date(other.start_time).getTime();
        const oEnd = new Date(other.end_time || other.start_time).getTime();
        const myStart = start.getTime();
        const myEnd = end.getTime();
        if (oStart < myEnd && oEnd > myStart) {
          isOverlap = true;
          break;
        }
      }

      entries.push({
        type: "event",
        id: item.id,
        item,
        startMins,
        endMins,
        durationMins: endMins - startMins,
        isPast,
        active,
        matchTask,
        isOverlap,
        isRoutine,
        moduleCode: modCode || null,
      });
      lastEndMins = Math.max(lastEndMins ?? 0, endMins);
    }

    const sorted = [...entries].sort((a, b) => (a.startMins ?? 0) - (b.startMins ?? 0));
    const showNow = selectedDate && now && isToday(selectedDate);
    const nowMins = showNow ? Math.max(0, (now.getHours() - DAY_START_HOUR) * 60 + now.getMinutes()) : null;
    if (showNow && nowMins != null && nowMins >= 0) {
      const endMinsOf = (r) => r.endMins ?? (r.gapStartMins ?? 0) + (r.minutes ?? 0);
      let insertIndex = sorted.length;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if (endMinsOf(sorted[i]) <= nowMins) {
          insertIndex = i + 1;
          break;
        }
      }
      sorted.splice(insertIndex, 0, { type: "now", id: "now-marker", nowMins });
    }
    const startMinsOf = (r) => r.startMins ?? r.gapStartMins ?? r.nowMins ?? 0;
    const endMinsOf = (r) => (r.type === "now" ? null : (r.endMins ?? (r.gapStartMins ?? 0) + (r.minutes ?? 0)));
    let prevEndMins = 0;
    let overlapGroupIndex = 0;
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      const start = startMinsOf(r);
      r.spacingBeforePx = i === 0 ? 0 : FIXED_ROW_GAP_PX;
      if (r.type === "event") {
        const prev = sorted[i - 1];
        const overlapsPrev = prev && prev.type === "event" && prev.endMins > r.startMins && r.endMins > prev.startMins;
        if (overlapsPrev) overlapGroupIndex += 1;
        else overlapGroupIndex = 0;
        r.overlapGroupIndex = overlapGroupIndex;
      }
      const end = endMinsOf(r);
      if (end != null) prevEndMins = end;
    }
    /* Group consecutive overlapping events into one row for side-by-side (50% width) conflict display */
    const finalRows = [];
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      if (r.type === "event" && r.isOverlap && r.overlapGroupIndex === 0) {
        const group = [r];
        for (let j = i + 1; j < sorted.length && sorted[j].type === "event" && sorted[j].overlapGroupIndex > 0; j++) {
          group.push(sorted[j]);
        }
        finalRows.push({
          type: "eventGroup",
          id: `conflict-${r.id}`,
          items: group,
          spacingBeforePx: r.spacingBeforePx,
          startMins: r.startMins,
          endMins: Math.max(...group.map((x) => x.endMins)),
        });
        i += group.length - 1;
      } else if (r.type === "event") {
        finalRows.push(r);
      } else {
        finalRows.push(r);
      }
    }
    return finalRows;
  }, [sortedEvents, selectedDate, dayStart, dayEnd, now, dayTasks, tasksDueToday]);

  const getGapStartDate = useCallback((gapStartMins) => {
    const d = new Date(selectedDate);
    d.setHours(DAY_START_HOUR, 0, 0, 0);
    d.setMinutes(d.getMinutes() + gapStartMins);
    return d;
  }, [selectedDate]);

  const timelineScrollRef = useRef(null);

  return (
    <div className={styles.planTimelineWrap} ref={timelineScrollRef}>
      <div className={styles.planTimelineList}>
        {rows.length === 0 && (
          <div className={styles.planTimelineEmpty}>
            <span className={styles.planTimelineEmptyText}>No events scheduled for this day.</span>
          </div>
        )}
        {rows.map((row, index) => {
          if (row.type === "tinyGap") {
            const mins = row.minutes ?? (row.endMins - row.startMins);
            return (
              <div key={row.id} className={styles.planTimelineRow} style={{ marginTop: row.spacingBeforePx || 0, minHeight: 20 }}>
                <div className={styles.planTimelineGutter}>
                  <span className={styles.planTimelineTime}>
                    {String(Math.floor(DAY_START_HOUR + row.startMins / 60)).padStart(2, "0")}:{String(row.startMins % 60).padStart(2, "0")}
                  </span>
                </div>
                <div className={styles.planTimelineSpineCell} aria-hidden />
                <div className={styles.planTimelineTinyGapLineWrap}>
                  <div className={styles.planTimelineTinyGapLine} aria-hidden />
                  <span className={styles.planTimelineTinyGapMicroBreak}>
                    ☕ {mins}m Reset: Perfect for a quick walk or water break.
                  </span>
                </div>
              </div>
            );
          }
          if (row.type === "now") {
            return (
              <div key={row.id} className={styles.planTimelineRow} style={{ marginTop: row.spacingBeforePx || 0, minHeight: 28 }}>
                <div className={styles.planTimelineGutter}>
                  <span className={styles.planTimelineTime}>{String(Math.floor(DAY_START_HOUR + row.nowMins / 60)).padStart(2, "0")}:{String(row.nowMins % 60).padStart(2, "0")}</span>
                </div>
                <div className={styles.planTimelineSpineCell} aria-hidden />
                <div className={styles.planTimelineNowWrap}>
                  <span className={styles.planTimelineNowLine} aria-hidden />
                  <span className={styles.planTimelineNowTag}>NOW</span>
                </div>
              </div>
            );
          }
          if (row.type === "free") {
            const durationStr = row.minutes >= 60
              ? `${Math.floor(row.minutes / 60)}h ${row.minutes % 60 ? `${row.minutes % 60}m` : ""}`.trim()
              : `${row.minutes}m`;
            const { suggested: suggestedTask, top3: top3Tasks } = getTasksThatFitGap(suggestableTasks || [], row.minutes);
            const getModuleOrListLabel = (task) =>
              task?.module_code || (taskLists || []).find((l) => String(l.id) === String(task?.task_list))?.name || "tasks";
            const gapStartDate = getGapStartDate(row.gapStartMins);
            const showSlotPopover = slotPopoverRowId === row.id;
            const cardLabel = suggestedTask
              ? `✨ ${durationStr} Focus Window. Perfect for: ${suggestedTask.title} from your ${getModuleOrListLabel(suggestedTask)} list.`
              : `✨ ${durationStr} Focus Window. Use this time intentionally.`;
            return (
              <div
                key={row.id}
                className={`${styles.planTimelineRow} ${styles.planTimelineRowGap}`}
                style={{ marginTop: row.spacingBeforePx || 0 }}
              >
                <div className={styles.planTimelineGutter}>
                  <span className={styles.planTimelineTime}>
                    {String(Math.floor(DAY_START_HOUR + row.gapStartMins / 60)).padStart(2, "0")}:
                    {String(row.gapStartMins % 60).padStart(2, "0")}
                  </span>
                </div>
                <div className={styles.planTimelineSpineCell}>
                  <span className={styles.planTimelineNode} aria-hidden>✨</span>
                </div>
                <div
                  className={`${styles.planTimelineFreeWindow} ${styles.planTimelineFreeWindowDashed}`}
                  ref={showSlotPopover ? slotPopoverRef : undefined}
                >
                  <span className={styles.planTimelineFreeWindowEmoji} aria-hidden>✨</span>
                  <span className={styles.planTimelineFreeWindowDuration} title={cardLabel}>
                    {cardLabel}
                  </span>
                  {onQuickStart && (
                    <div className={styles.planTimelineFreeWindowActions}>
                      <button
                        type="button"
                        className={styles.planTimelineFreeBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlotPopoverRowId((id) => (id === row.id ? null : row.id));
                        }}
                        aria-label="Slot a task into this window"
                        aria-expanded={showSlotPopover}
                      >
                        + Slot Task
                      </button>
                    </div>
                  )}
                  {showSlotPopover && top3Tasks.length > 0 && (
                    <div className={styles.planTimelineSlotPopover}>
                      <div className={styles.planTimelineSlotPopoverTitle}>Tasks that fit this window</div>
                      {top3Tasks.map((t) => (
                        <button
                          key={t.id ?? t.title}
                          type="button"
                          className={styles.planTimelineSlotPopoverItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickStart(gapStartDate, row.minutes, t);
                            setSlotPopoverRowId(null);
                          }}
                        >
                          <span className={styles.planTimelineSlotPopoverItemTitle} title={t.title}>{t.title}</span>
                          <span className={styles.planTimelineSlotPopoverItemMeta}>
                            {(t.estimated_blocks || 1) * 25}m · {getModuleOrListLabel(t)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showSlotPopover && top3Tasks.length === 0 && (
                    <div className={styles.planTimelineSlotPopover}>
                      <div className={styles.planTimelineSlotPopoverEmpty}>No tasks fit this window. Try a shorter task or add one.</div>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (row.type === "eventGroup") {
            const groupItems = row.items;
            return (
              <div
                key={row.id}
                className={styles.planTimelineRow}
                style={{ marginTop: row.spacingBeforePx || 0 }}
              >
                <div className={styles.planTimelineGutter}>
                  <span className={styles.planTimelineTime}>
                    {String(Math.floor(DAY_START_HOUR + row.startMins / 60)).padStart(2, "0")}:{String(row.startMins % 60).padStart(2, "0")}
                  </span>
                </div>
                <div className={styles.planTimelineSpineCell}>
                  {groupItems.map((r) => (
                    <span key={`node-${r.id}-${getTaskEmoji(r.item.title, r.item.start_time)}`} className={styles.planTimelineNode} aria-hidden>
                      {getTaskEmoji(r.item.title, r.item.start_time)}
                    </span>
                  ))}
                </div>
                <div className={styles.planTimelineConflictGroup}>
                  {groupItems.map((r) => {
                    const { item, isPast, active, matchTask, isRoutine, moduleCode, durationMins } = r;
                    const startTimeStr = item.start_time ? formatTime(item.start_time) : "";
                    const endTimeStr = item.end_time && item.end_time !== item.start_time ? formatTime(item.end_time) : "";
                    const titleClean = stripEmojiFromTitle(item.title);
                    const showConflictPopover = conflictPopoverRowId === r.id;
                    const nextFreeRow = onConflictAutoMove && rows.find((fr) => fr.type === "free" && fr.gapStartMins >= r.endMins && fr.minutes >= durationMins);
                    const handleConflictCardClick = () => {
                      setConflictPopoverRowId((id) => (id === r.id ? null : r.id));
                    };
                    const listForTask = matchTask?.task_list != null ? (taskLists || []).find((l) => String(l.id) === String(matchTask.task_list)) : null;
                    return (
                      <div key={r.id} className={styles.planTimelineConflictCardWrap} ref={showConflictPopover ? conflictPopoverRef : undefined}>
                        <div
                          role="button"
                          tabIndex={0}
                          className={`${styles.planTimelineCard} ${styles.planTimelineCardConflict} ${active ? styles.planTimelineCardNow : ""} ${isPast ? styles.planTimelineCardPast : ""} ${isRoutine ? styles.planTimelineCardRoutine : ""} ${durationMins != null && durationMins > 0 ? styles.planTimelineCardWithDuration : ""}`}
                          onClick={handleConflictCardClick}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleConflictCardClick(); } }}
                          title={item.end_time ? `${item.title} — ${startTimeStr} – ${endTimeStr}` : `${item.title} — ${startTimeStr}`}
                        >
                          <div className={styles.planTimelineCardBody}>
                            <div className={styles.planTimelineCardTimeStack}>
                              <div className={styles.planTimelineCardTimeRow}>
                                <span className={styles.planTimelineCardTimeSlot}>
                                  {startTimeStr}{item.end_time && endTimeStr !== startTimeStr ? ` – ${endTimeStr}` : ""}
                                </span>
                                <div className={styles.planTimelineCardTagsSlot}>
                                  <span className={styles.planTimelineTimeConflictBadge}><span className={styles.planTimelineConflictIcon} aria-hidden>⚠️</span> Time conflict</span>
                                  <button type="button" className={styles.planTimelineRescheduleBtn} onClick={(e) => { e.stopPropagation(); setConflictPopoverRowId((id) => (id === r.id ? null : r.id)); }} aria-label="Reschedule" title="Reschedule">
                                    <CalendarClock size={14} strokeWidth={2} aria-hidden />
                                    <span>Reschedule</span>
                                  </button>
                                  {moduleCode && (
                                    <Link to={matchTask ? `/tasks?list=${matchTask.task_list}&module=${encodeURIComponent(moduleCode)}` : `/tasks?module=${encodeURIComponent(moduleCode)}`} className={styles.planTimelineModulePillLink} onClick={(e) => e.stopPropagation()}>
                                      <span className={styles.planTimelineModulePill}>{moduleCode}</span>
                                    </Link>
                                  )}
                                  {!moduleCode && matchTask?.task_list != null && (() => {
                                    const list = (taskLists || []).find((l) => String(l.id) === String(matchTask.task_list));
                                    return (
                                      <Link to={`/tasks?list=${matchTask.task_list}`} className={styles.planTimelineModulePillLink} onClick={(e) => e.stopPropagation()}>
                                        <span className={styles.planTimelineModulePill}>{list?.name || "List"}</span>
                                      </Link>
                                    );
                                  })()}
                                </div>
                              </div>
                              <span className={styles.planTimelineCardTitle}>{titleClean || item.title}</span>
                            </div>
                          </div>
                          {durationMins != null && durationMins > 0 && (
                            <span className={styles.planTimelineCardDurationPill}>{fmtDurationShort(durationMins)}</span>
                          )}
                        </div>
                        {showConflictPopover && (
                          <div className={styles.planTimelineConflictPopover}>
                            <div className={styles.planTimelineConflictPopoverTitle}>
                              {nextFreeRow ? `Move to ${formatTime(getGapStartDate(nextFreeRow.gapStartMins).toISOString())} free window?` : "Time Conflict"}
                            </div>
                            <button type="button" className={styles.planTimelineConflictPopoverBtn} onClick={() => { if (nextFreeRow && onConflictAutoMove) { const start = getGapStartDate(nextFreeRow.gapStartMins); const end = new Date(start.getTime() + durationMins * 60000); onConflictAutoMove(item, start, end); setConflictPopoverRowId(null); } }} disabled={!nextFreeRow}>
                              {nextFreeRow ? "Confirm" : "No free window"}
                            </button>
                            <button type="button" className={styles.planTimelineConflictPopoverBtn} onClick={() => { onEdit?.(item, item.tag); setConflictPopoverRowId(null); }}>Edit Time</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          const { item, isPast, active, matchTask, isOverlap, isRoutine, moduleCode, durationMins } = row;
          const startTimeStr = item.start_time ? formatTime(item.start_time) : "";
          const endTimeStr = item.end_time && item.end_time !== item.start_time ? formatTime(item.end_time) : "";
          const titleClean = stripEmojiFromTitle(item.title);
          const showConflictPopover = conflictPopoverRowId === row.id;
          const nextFreeRow = isOverlap && onConflictAutoMove && rows.find((r) => r.type === "free" && r.gapStartMins >= row.endMins && r.minutes >= durationMins);
          const handleConflictCardClick = () => {
            if (isOverlap) {
              setConflictPopoverRowId((id) => (id === row.id ? null : row.id));
              return;
            }
            if (onCardClick) onCardClick(item, matchTask);
            else onEdit?.(item, item.tag);
          };
          const listForTask = matchTask?.task_list != null ? (taskLists || []).find((l) => String(l.id) === String(matchTask.task_list)) : null;
          const listNameLower = (listForTask?.name || "").toLowerCase();
          const isPersonalList = /personal|health|wellness|finance|home/.test(listNameLower);
          return (
            <div
              key={row.id}
              className={styles.planTimelineRow}
              style={{
                marginTop: row.spacingBeforePx || 0,
              }}
            >
              <div className={styles.planTimelineGutter}>
                <span className={styles.planTimelineTime}>{startTimeStr}</span>
              </div>
              <div className={styles.planTimelineSpineCell}>
                <span key={`node-${row.id}-${getTaskEmoji(item.title, item.start_time)}`} className={styles.planTimelineNode} aria-hidden>
                  {getTaskEmoji(item.title, item.start_time)}
                </span>
              </div>
              <div className={styles.planTimelineCardWrap} ref={showConflictPopover ? conflictPopoverRef : undefined}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`${styles.planTimelineCard} ${active ? styles.planTimelineCardNow : ""} ${isPast ? styles.planTimelineCardPast : ""} ${isOverlap ? styles.planTimelineCardOverlap : ""} ${isRoutine ? styles.planTimelineCardRoutine : ""} ${durationMins != null && durationMins > 0 ? styles.planTimelineCardWithDuration : ""}`}
                  onClick={handleConflictCardClick}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleConflictCardClick(); } }}
                  title={item.end_time ? `${item.title} — ${startTimeStr} – ${endTimeStr}` : `${item.title} — ${startTimeStr}`}
                >
                <div className={styles.planTimelineCardBody}>
                  <div className={styles.planTimelineCardTimeStack}>
                    <div className={styles.planTimelineCardTimeRow}>
                      <span className={styles.planTimelineCardTimeSlot}>
                        {startTimeStr}{item.end_time && endTimeStr !== startTimeStr ? ` – ${endTimeStr}` : ""}
                      </span>
                      <div className={styles.planTimelineCardTagsSlot}>
                        {isOverlap && (
                          <>
                            <span className={styles.planTimelineTimeConflictBadge}><span className={styles.planTimelineConflictIcon} aria-hidden>⚠️</span> Time conflict</span>
                            <button
                              type="button"
                              className={styles.planTimelineRescheduleBtn}
                              onClick={(e) => { e.stopPropagation(); setConflictPopoverRowId((id) => (id === row.id ? null : row.id)); }}
                              aria-label="Reschedule to next free window"
                              title="Reschedule"
                            >
                              <CalendarClock size={14} strokeWidth={2} aria-hidden />
                              <span>Reschedule</span>
                            </button>
                          </>
                        )}
                        {moduleCode && (
                          <Link
                            to={matchTask ? `/tasks?list=${matchTask.task_list}&module=${encodeURIComponent(moduleCode)}` : `/tasks?module=${encodeURIComponent(moduleCode)}`}
                            className={styles.planTimelineModulePillLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className={styles.planTimelineModulePill}>{moduleCode}</span>
                          </Link>
                        )}
                        {!moduleCode && matchTask?.task_list != null && (() => {
                          const list = (taskLists || []).find((l) => String(l.id) === String(matchTask.task_list));
                          const listName = list?.name || "List";
                          return (
                            <Link to={`/tasks?list=${matchTask.task_list}`} className={styles.planTimelineModulePillLink} onClick={(e) => e.stopPropagation()}>
                              <span className={styles.planTimelineModulePill}>{listName}</span>
                            </Link>
                          );
                        })()}
                      </div>
                    </div>
                    <span className={styles.planTimelineCardTitle}>{titleClean || item.title}</span>
                  </div>
                </div>
                {durationMins != null && durationMins > 0 && (
                  <span className={styles.planTimelineCardDurationPill}>{fmtDurationShort(durationMins)}</span>
                )}
                {matchTask && onHarvestToggle && (
                  <button
                    type="button"
                    className={styles.planTimelineCardCheck}
                    onClick={(e) => { e.stopPropagation(); onHarvestToggle(matchTask, !matchTask.completed); }}
                    aria-label={matchTask.completed ? "Mark incomplete" : "Mark done"}
                    aria-pressed={matchTask.completed}
                  >
                    {matchTask.completed ? "✓" : ""}
                  </button>
                )}
              </div>
              {showConflictPopover && (
                <div className={styles.planTimelineConflictPopover}>
                  <div className={styles.planTimelineConflictPopoverTitle}>
                    {nextFreeRow
                      ? `Move this to your ${formatTime(getGapStartDate(nextFreeRow.gapStartMins).toISOString())} Free Window?`
                      : "Time Conflict"}
                  </div>
                  <button
                    type="button"
                    className={styles.planTimelineConflictPopoverBtn}
                    onClick={() => {
                      if (nextFreeRow && onConflictAutoMove) {
                        const start = getGapStartDate(nextFreeRow.gapStartMins);
                        const end = new Date(start.getTime() + durationMins * 60000);
                        onConflictAutoMove(item, start, end);
                        setConflictPopoverRowId(null);
                      }
                    }}
                    disabled={!nextFreeRow}
                  >
                    {nextFreeRow ? "Confirm" : "No free window"}
                  </button>
                  <button
                    type="button"
                    className={styles.planTimelineConflictPopoverBtn}
                    onClick={() => { onEdit?.(item, item.tag); setConflictPopoverRowId(null); }}
                  >
                    Edit Time
                  </button>
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Task widget row */
function TaskWidgetRow({ task, onPlay, isActiveInTimer }) {
  const color   = PRIORITY_COLOURS[task.priority] || "var(--muted)";
  const estMins = task.estimated_blocks ? task.estimated_blocks * 25 : null;
  const priorityClass = task.priority === "urgent" ? styles.twDotUrgent
    : task.priority === "high" ? styles.twDotHigh
    : task.priority === "low" ? styles.twDotLow
    : "";
  const moduleId = task.moduleId ?? task.module_id;
  const moduleCode = task.module_code;
  const assignmentType = (task.assignment_type || task.deadline_type || "").toLowerCase();
  const typeBubbleClass =
    assignmentType === "exam" ? styles.twBubbleExam
    : assignmentType === "coursework" ? styles.twBubbleCoursework
    : assignmentType === "lab" ? styles.twBubbleOther
    : null;
  const typeLabel = assignmentType === "exam" ? "Exam" : assignmentType === "coursework" ? "Coursework" : assignmentType === "lab" ? "Lab" : null;
  const moduleHref = moduleId ? `/modules?moduleId=${moduleId}` : (moduleCode ? `/modules?code=${encodeURIComponent(moduleCode)}` : "/modules");

  return (
    <div className={`${styles.twRow} ${isActiveInTimer ? styles.twRowActiveTimer : ""}`}>
      <div className={styles.twLeft}>
        <span className={`${styles.twDot} ${priorityClass}`} style={{ background: color }} />
        <div className={styles.twBody}>
          <span className={styles.twTitle}>{task.title}</span>
          <div className={styles.twMeta}>
            {(moduleCode || moduleId) && (
              <Link to={moduleHref} className={`${styles.twBubble} ${styles.twBubbleModule}`} onClick={(e) => e.stopPropagation()}>
                {moduleCode || `Module ${moduleId}`}
              </Link>
            )}
            {typeLabel && typeBubbleClass && (
              <span className={`${styles.twBubble} ${typeBubbleClass}`}>{typeLabel}</span>
            )}
            {estMins && <span className={styles.twTime}>{fmtDuration(estMins)}</span>}
          </div>
        </div>
      </div>
      {onPlay && !task.completed && (
        <button
          type="button"
          className={styles.twPlay}
          title="Start timer for this task"
          onClick={() => onPlay(task)}
          aria-label="Start timer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7L8 5z" /></svg>
        </button>
      )}
    </div>
  );
}

/* Task widget — always visible; context-aware empty: brand new vs all completed */
function TaskWidget({ tasks, selectedDate, onViewAllTasks, onPlay, onAddTask, backlogLabel, activeTimerTaskId, isBrandNew, isAllCompleted }) {
  const topTasks = useMemo(() => tasks.slice(0, 5), [tasks]);
  const label    = backlogLabel ? "TO SCHEDULE" : (isToday(selectedDate) ? "TODAY'S TASKS" : "TASKS DUE");
  const isEmpty  = topTasks.length === 0;

  const emptyMessage = isBrandNew
    ? "🌱 Your garden is clear — plant your first goal?"
    : isAllCompleted
    ? "🌳 Forest complete — rest and grow"
    : "🌳 Forest complete — rest and grow";
  const emptyIcon = isBrandNew ? "🌱" : isAllCompleted ? "🌳" : "🌿";

  return (
    <div className={styles.taskWidget}>
      <div className={styles.taskWidgetHeader}>
        <span className={styles.taskWidgetTitle}>{label}</span>
        <div className={styles.taskWidgetHeaderActions}>
          {isEmpty && onAddTask && (
            <button
              type="button"
              className={styles.taskWidgetAddBtn}
              onClick={onAddTask}
              title="Add task"
              aria-label="Add task"
            >
              +
            </button>
          )}
          <button
            type="button"
            className={styles.taskWidgetLink}
            onClick={() => onViewAllTasks?.()}
          >
            All tasks →
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className={styles.taskWidgetEmpty}>
          <span className={styles.taskWidgetEmptyIcon} aria-hidden>{emptyIcon}</span>
          <p className={styles.taskWidgetEmptyText}>{emptyMessage}</p>
          {onAddTask && (isBrandNew || !isAllCompleted) && (
            <button
              type="button"
              className={styles.taskWidgetEmptyBtn}
              onClick={onAddTask}
            >
              + Add Task
            </button>
          )}
        </div>
      ) : (
        <div className={styles.taskWidgetList}>
          {topTasks.map((task) => (
            <TaskWidgetRow
              key={task.id}
              task={task}
              onPlay={onPlay}
              isActiveInTimer={activeTimerTaskId != null && String(task.id) === String(activeTimerTaskId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Empty day — Zen state when no tasks scheduled */
function EmptyDay() {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>🌱</span>
      <p>Your garden is clear</p>
      <p className={styles.emptySub}>Time to plant tomorrow&apos;s goals?</p>
    </div>
  );
}

/* HOME PAGE */
export default function Homepage({ onNavigate }) {
  const navigate         = useNavigate();
  const { selectedDate } = useCalendar();
  const dispatch         = useCalendarDispatch();
  const { loadEvents }   = useCalendarEvents();
  const { removeEvent, addEvent, editEvent } = useEventActions();
  const { openModal }    = useEventModal();
  const { getTag, tags }       = useTags();
  const { setActiveTaskId, isActive: timerActive, timeLeft, task: timerTask, progress: timerProgress, setIsActive: setTimerActive, mode: timerMode, setMode: setTimerMode, setTimeLeft, workTime, breakTime, resetTimer, setTask: setTimerTask } = useTimerContext();
  const hasTimerSession = timerActive || (timerTask && timeLeft > 0);

  const startFocusInWidget = useCallback(() => {
    setTimerMode("work");
    setTimeLeft((workTime || 25) * 60);
    setTimerTask("Focus");
    setTimerActive(true);
  }, [setTimerMode, setTimeLeft, workTime, setTimerTask, setTimerActive]);
  const { showHarvestToast, showLevelUpToast } = useHarvestCelebration();

  const displayName = useMemo(() => {
    try {
      const s = localStorage.getItem("user");
      if (!s) return null;
      const u = JSON.parse(s);
      return (u.first_name || "").trim() || (u.username || "").trim() || null;
    } catch {
      return null;
    }
  }, []);

  const { dayEvents, dayTasks, allTasks, removePendingTask, refetchTasks } = useHomeData(selectedDate);
  const isBrandNewTasks = (allTasks || []).length === 0;
  const isAllTasksCompleted = (allTasks || []).length > 0 && (allTasks || []).filter((t) => !t.completed).length === 0;
  const [toast, setToast] = useState(null);
  const [pastCollapsed, setPastCollapsed] = useState(true);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
  const [modulesList, setModulesList] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [highlightedModuleId, setHighlightedModuleId] = useState(null);
  const [moduleFilterId, setModuleFilterId] = useState(null);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [rescheduleTask, setRescheduleTask] = useState(null);
  const [planTimelineReadItem, setPlanTimelineReadItem] = useState(null);
  const [celebratingTaskId, setCelebratingTaskId] = useState(null);
  const [floatingSeedTaskId, setFloatingSeedTaskId] = useState(null);
  const [floatingSeedXp, setFloatingSeedXp] = useState(0);
  const [nowHeroFocusBtnHovered, setNowHeroFocusBtnHovered] = useState(false);
  const [showXPSparks, setShowXPSparks] = useState(false);
  const prevTimeLeftRef = useRef(null);
  const [taskLists, setTaskLists] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [scheduleCountdownSecs, setScheduleCountdownSecs] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const moduleOverviewRef = useRef(null);
  const actionHubRef = useRef(null);
  const nowCardRef = useRef(null);

  useEffect(() => {
    nowCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  useEffect(() => {
    const read = () => { try { setActiveTimerTaskId(sessionStorage.getItem("timerTaskId")); } catch (_) {} };
    read();
    window.addEventListener("focus", read);
    return () => window.removeEventListener("focus", read);
  }, []);

  /* Live Laser: real-time 'Now' marker — updates every 30s so the line moves down the timeline */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  /* Live countdown for current task (end time) or next task (start time) — ticks every second when today */
  useEffect(() => {
    if (!isToday(selectedDate) || !dayEvents?.length) {
      setScheduleCountdownSecs(null);
      return;
    }
    const sorted = [...dayEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const nowItem = sorted.find((e) => isNow(e.start_time, e.end_time));
    const nextItem = nowItem
      ? null
      : sorted.find((e) => e.start_time && new Date(e.start_time).getTime() > Date.now());
    const target = nowItem
      ? new Date(nowItem.end_time || nowItem.start_time)
      : nextItem
        ? new Date(nextItem.start_time)
        : null;
    const tick = () => {
      if (!target) {
        setScheduleCountdownSecs(null);
        return;
      }
      const secs = Math.max(0, Math.round((target.getTime() - Date.now()) / 1000));
      setScheduleCountdownSecs(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [selectedDate, dayEvents]);

  useEffect(() => {
    getModules().then((list) => setModulesList(Array.isArray(list) ? list : [])).catch(() => setModulesList([]));
  }, []);
  useEffect(() => {
    getEnrollments().then((list) => setEnrollments(Array.isArray(list) ? list : [])).catch(() => setEnrollments([]));
  }, []);
  useEffect(() => {
    getUpcomingDeadlines().then((list) => setUpcomingDeadlines(Array.isArray(list) ? list : [])).catch(() => setUpcomingDeadlines([]));
  }, []);

  useEffect(() => {
    analyticsService.getSummary(7).then((data) => setAnalyticsSummary(data)).catch(() => setAnalyticsSummary(null));
  }, []);

  /* When work timer hits 0 in the NOW widget: soft chime + subtle +1 XP sparks */
  useEffect(() => {
    if (hasTimerSession && timerMode === "work" && prevTimeLeftRef.current > 0 && timeLeft === 0) {
      playZenChime(0.35);
      setShowXPSparks(true);
      const t = setTimeout(() => setShowXPSparks(false), 1400);
      return () => clearTimeout(t);
    }
    prevTimeLeftRef.current = timeLeft;
  }, [hasTimerSession, timerMode, timeLeft]);

  useEffect(() => {
    if (showCreateTaskModal) {
      fetchTaskLists().then((list) => setTaskLists(Array.isArray(list) ? list : [])).catch(() => setTaskLists([]));
    }
  }, [showCreateTaskModal]);

  /* Fetch task lists on mount so Action Hub can show list names (e.g. University, SEG) and link to /tasks?list= */
  useEffect(() => {
    fetchTaskLists().then((list) => setTaskLists(Array.isArray(list) ? list : [])).catch(() => setTaskLists([]));
  }, []);

  const handleModuleTagClick = useCallback((moduleId, moduleCode) => {
    const url = moduleId
      ? `/modules?moduleId=${moduleId}`
      : moduleCode
        ? `/modules?code=${encodeURIComponent(moduleCode)}`
        : "/modules";
    navigate(url);
  }, [navigate]);

  const modulesWithSeeds = useMemo(() => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return (modulesList || []).map((mod) => {
      const related = (allTasks || []).filter(
        (t) =>
          String(t.module_id || t.module || t.moduleId || "") === String(mod.id) ||
          (t.module_code || "").toUpperCase().trim() === (mod.module_code || "").toUpperCase().trim()
      );
      const totalTasks = related.length;
      const seedsGrown = related.filter((t) => t.completed).length;
      const pct = totalTasks > 0 ? Math.round((seedsGrown / totalTasks) * 100) : 0;
      const hasUrgent =
        pct === 0 &&
        totalTasks > 0 &&
        related.some(
          (t) =>
            !t.completed &&
            t.due_date &&
            (new Date(t.due_date) <= now || new Date(t.due_date) <= in7Days)
        );
      return { ...mod, seedsGrown, totalTasks, pct, hasUrgent };
    });
  }, [modulesList, allTasks]);

  /* Current Modules: only enrolled modules that have deadlines, max 3; hide section if none */
  const moduleIdsWithDeadlines = useMemo(
    () => new Set((upcomingDeadlines || []).map((d) => String(d.module ?? d.module_id ?? "")).filter(Boolean)),
    [upcomingDeadlines]
  );
  const currentModules = useMemo(() => {
    return (modulesWithSeeds || [])
      .filter((m) => isEnrolledIn(m.id, enrollments) && moduleIdsWithDeadlines.has(String(m.id)))
      .slice(0, 3);
  }, [modulesWithSeeds, enrollments, moduleIdsWithDeadlines]);

  const enrolledModules = useMemo(
    () => (modulesList || []).filter((m) => isEnrolledIn(m.id, enrollments)),
    [modulesList, enrollments]
  );

  const getTaskCategoryPillMeta = useCallback((task) => {
    const listId = task.task_list != null ? String(task.task_list) : null;
    const list = (taskLists || []).find((l) => String(l.id) === listId);
    if (list?.name) return { label: String(list.name).trim().slice(0, 20), listId };
    const modId = task.module_id ?? task.module ?? task.moduleId;
    const mod = (enrolledModules || []).find((m) => String(m.id) === String(modId));
    if (mod) return { label: (mod.module_code || mod.module_name || `M${mod.id}`).toString().trim().slice(0, 8), listId: null };
    if (task.module_code) return { label: String(task.module_code).trim().slice(0, 8), listId: null };
    const tag = getTag && getTag(task.tag);
    if (tag?.label) return { label: String(tag.label).trim().slice(0, 8), listId: null };
    return null;
  }, [taskLists, enrolledModules, getTag]);

  const getTaskCategoryPill = useCallback((task) => {
    const meta = getTaskCategoryPillMeta(task);
    return meta ? meta.label : null;
  }, [getTaskCategoryPillMeta]);

  /** 'sage' = Academic (left border), 'flax' = Personal. */
  const getTaskCategoryColor = useCallback((task) => {
    const tag = getTag && getTag(task.tag);
    const label = (tag?.label || "").toString().toLowerCase();
    if (label.includes("academic")) return "sage";
    if (label.includes("personal")) return "flax";
    if (task.module_id ?? task.module ?? task.moduleId ?? task.module_code) return "sage";
    return "flax";
  }, [getTag]);

  const getActionHubXp = (task) => {
    const p = task?.priority;
    if (p === "urgent") return 15;
    if (p === "high") return 12;
    if (p === "medium") return 10;
    return 8;
  };

  const handleActionHubComplete = useCallback(async (t) => {
    if (t.completed) return;
    const xp = getActionHubXp(t);
    try {
      await updateTask(t.id, { completed: true });
      refetchTasks();
      const isRoutine = isRoutineHarvestTask(t);
      showHarvestToast(getHarvestMessage(t), { isRoutine });
      if (!isRoutine) {
        setFloatingSeedXp(xp);
        setFloatingSeedTaskId(t.id);
        setTimeout(() => { setFloatingSeedTaskId(null); setFloatingSeedXp(0); }, 1400);
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(520, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.06);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
        } catch (_) {}
      }
    } catch {
      setToast("Couldn't complete task.");
    }
  }, [showHarvestToast, refetchTasks]);

  // Show toast for 3 seconds
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const setSelectedDate = (date) => dispatch({ type: "SET_SELECTED_DATE", payload: date });

  const scheduleTitle = isToday(selectedDate) ? "Today's schedule" : "Schedule";

  const sortedEvents = useMemo(
    () => [...dayEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
    [dayEvents]
  );

  const pastItems = useMemo(
    () => sortedEvents.filter((it) => {
      const end = it.end_time || it.start_time;
      return end && new Date(end) < now && !isNow(it.start_time, it.end_time);
    }),
    [sortedEvents, now]
  );

  const upcomingItems = useMemo(() => {
    const pastIds = new Set(pastItems.map((x) => x.id));
    return sortedEvents.filter((it) => !pastIds.has(it.id));
  }, [sortedEvents, pastItems]);

  /* Include overlapping past events in timeline so both show side-by-side in the same time block */
  const upcomingForTimeline = useMemo(() => {
    const upcomingIds = new Set(upcomingItems.map((e) => e.id));
    const pastThatOverlap = pastItems.filter((past) => {
      const pastStart = new Date(past.start_time);
      const pastEnd = new Date(past.end_time || past.start_time);
      return upcomingItems.some((up) => {
        const upStart = new Date(up.start_time);
        const upEnd = new Date(up.end_time || up.start_time);
        return pastEnd > upStart && pastStart < upEnd;
      });
    });
    const combined = [...upcomingItems, ...pastThatOverlap];
    return combined.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [upcomingItems, pastItems]);

  const pastIdsShownInTimeline = useMemo(
    () => new Set(
      pastItems.filter((past) => {
        const pastEnd = new Date(past.end_time || past.start_time);
        return upcomingItems.some((up) => pastEnd > new Date(up.start_time) && new Date(past.start_time) < new Date(up.end_time || up.start_time));
      }).map((p) => p.id)
    ),
    [pastItems, upcomingItems]
  );

  const pastItemsForSection = useMemo(
    () => pastItems.filter((p) => !pastIdsShownInTimeline.has(p.id)),
    [pastItems, pastIdsShownInTimeline]
  );

  /* Missed: past events that were scheduled but not done — show in "Missed" with Re-schedule for tomorrow (today only; exclude system events) */
  const SYSTEM_EVENT_SOURCES = ["module_deadline", "module_enrollment"];
  const missedItems = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    return pastItemsForSection.filter(
      (p) => !p.source || !SYSTEM_EVENT_SOURCES.includes(String(p.source))
    );
  }, [selectedDate, pastItemsForSection]);

  const handleRescheduleTomorrow = useCallback(
    async (item) => {
      try {
        const start = new Date(item.start_time);
        const end = item.end_time ? new Date(item.end_time) : new Date(start.getTime() + 25 * 60000);
        const durationMins = Math.round((end - start) / 60000) || 25;
        const tomorrow = new Date(selectedDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const endTomorrow = new Date(tomorrow.getTime() + durationMins * 60000);
        await addEvent({
          title: item.title,
          description: item.description || "",
          start_time: tomorrow.toISOString(),
          end_time: endTomorrow.toISOString(),
        });
        const baseId = extractBaseEventId(item.id);
        await removeEvent(baseId);
        await loadEvents();
        showToast(`"${item.title}" re-scheduled for tomorrow at 9:00`);
      } catch {
        showToast("Couldn't re-schedule. Try again.");
      } finally {
        refetchTasks();
      }
    },
    [selectedDate, addEvent, removeEvent, loadEvents, showToast, refetchTasks]
  );

  /** Move overdue task to next free slot today, or to tomorrow if none. */
  const handleReschedule = useCallback(
    async (item) => {
      const start = new Date(item.start_time);
      const end = item.end_time ? new Date(item.end_time) : new Date(start.getTime() + 25 * 60000);
      const durationMins = Math.round((end - start) / 60000) || 25;
      const slot = getNextFreeSlotToday(sortedEvents, selectedDate, durationMins);
      const baseId = extractBaseEventId(item.id);
      try {
        if (slot) {
          await editEvent(baseId, {
            start_time: slot.start.toISOString(),
            end_time: slot.end.toISOString(),
          });
          await loadEvents();
          showToast(`"${item.title}" moved to ${formatTime(slot.start.toISOString())}`);
        } else {
          await handleRescheduleTomorrow(item);
        }
      } catch {
        showToast("Couldn't reschedule. Try again.");
      }
    },
    [selectedDate, sortedEvents, editEvent, loadEvents, showToast, handleRescheduleTomorrow]
  );

  const handleQuickStartGap = useCallback(
    async (gapStartDate, _gapMins, task) => {
      if (!task) return;
      try {
        const durationMins = (task.estimated_blocks || 1) * 25;
        const endDate = new Date(gapStartDate.getTime() + durationMins * 60000);
        await addEvent({
          title: task.title,
          start_time: gapStartDate.toISOString(),
          end_time: endDate.toISOString(),
          description: task.description || "",
        });
        await loadEvents();
        showToast(`"${task.title}" added to your schedule at ${formatTime(gapStartDate.toISOString())}`);
      } catch {
        showToast("Couldn't add to schedule. Try again.");
      }
    },
    [addEvent, loadEvents, showToast]
  );

  const handleConflictAutoMove = useCallback(
    async (event, newStart, newEnd) => {
      try {
        await editEvent(extractBaseEventId(event.id), {
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString(),
        });
        await loadEvents();
        showToast("Event moved to next available window.");
      } catch {
        showToast("Couldn't move event. Try again.");
      }
    },
    [editEvent, loadEvents, showToast]
  );

  const scheduledTitles = useMemo(
    () => new Set(upcomingItems.map((e) => e.title?.toLowerCase())),
    [upcomingItems]
  );

  const suggestableTasks = useMemo(
    () => dayTasks.filter((t) => !scheduledTitles.has(t.title?.toLowerCase())),
    [dayTasks, scheduledTitles]
  );

  const upcomingTimeline = useMemo(
    () => computeTimelineWithGaps(upcomingForTimeline, suggestableTasks),
    [upcomingForTimeline, suggestableTasks]
  );

  const upcomingItemEntries = upcomingTimeline.filter((e) => e.type === "item" || e.type === "cluster");

  /* Current time as % of visible day (6am–10pm) for timeline now-line; only when viewing today */
  const timelineNowPercent = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const startMins = 6 * 60;
    const endMins = 22 * 60;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (nowMins < startMins) return 0;
    if (nowMins >= endMins) return 100;
    return Math.max(0, Math.min(100, ((nowMins - startMins) / (endMins - startMins)) * 100));
  }, [selectedDate, now]);

  const mustDoTasks = useMemo(() => {
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    return dayTasks.filter(
      (t) => (t.priority === "urgent" || t.priority === "high") && t.due_date && new Date(t.due_date) <= dayEnd && new Date(t.due_date) >= dayStart
    );
  }, [dayTasks, selectedDate]);

  const dayProgress = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    const now = new Date();
    if (now < startOfDay) return { percent: 0, message: "Your day hasn't started yet — get set!" };
    if (now > endOfDay) return { percent: 100, message: "Your day is complete — well done!" };
    const percent = Math.round(((now - startOfDay) / (endOfDay - startOfDay + 1)) * 100);
    const message = percent >= 100
      ? "Your day is complete — well done!"
      : `${percent}% of your day is complete — you're doing great!`;
    return { percent: Math.min(100, percent), message };
  }, [selectedDate]);

  const lectureCount = useMemo(
    () => sortedEvents.filter(isLecture).length,
    [sortedEvents]
  );

  const tasksDueToday = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    const now = new Date();
    const filtered = (allTasks || []).filter((t) => {
      const d = t.due_date ? new Date(t.due_date) : null;
      return d && d >= dayStart && d <= dayEnd;
    });
    const isOverdue = (task) => !task.completed && task.due_date && new Date(task.due_date) < now;
    return [...filtered].sort((a, b) => {
      const aOver = isOverdue(a);
      const bOver = isOverdue(b);
      if (aOver && !bOver) return -1;
      if (!aOver && bOver) return 1;
      return 0;
    });
  }, [selectedDate, allTasks]);

  const filteredTasksDueToday = useMemo(() => {
    if (!moduleFilterId) return tasksDueToday;
    const mod = (enrolledModules || []).find((m) => String(m.id) === String(moduleFilterId));
    if (!mod) return tasksDueToday;
    return tasksDueToday.filter(
      (t) =>
        String(t.module_id || t.module || t.moduleId || "") === String(moduleFilterId) ||
        (t.module_code || "").toUpperCase().trim() === (mod.module_code || "").toUpperCase().trim()
    );
  }, [tasksDueToday, moduleFilterId, enrolledModules]);

  /* Live progress: task-based so it updates when checkboxes change or tasks are rescheduled. Routine/event tasks count as "done" when time has passed (auto-pass). */
  const todaysTaskProgress = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const total = tasksDueToday.length;
    const crushed = tasksDueToday.filter(
      (t) => t.completed || isAutoPassedTask(t, now, getTag)
    ).length;
    const percent = total > 0 ? Math.round((crushed / total) * 100) : 0;
    return { total, crushed, percent };
  }, [selectedDate, tasksDueToday, now, getTag]);

  /* Goals Crushed / Seed Growth: only non-routine tasks. Routine events do NOT count. */
  const goalsOnlyProgress = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const goalTasks = tasksDueToday.filter((t) => !isRoutineOrEventTask(t, getTag));
    const total = goalTasks.length;
    const crushed = goalTasks.filter((t) => t.completed).length;
    const percent = total > 0 ? Math.round((crushed / total) * 100) : 0;
    return { total, crushed, percent };
  }, [selectedDate, tasksDueToday, getTag]);

  /* Seeds by category for Growth by Category: completed + tag Academic/Personal only, excluding routine. Updates when task is checked. */
  const seedCategoryBreakdown = useMemo(
    () => calculateSeedsByCategory(tasksDueToday, getTag),
    [tasksDueToday, getTag]
  );

  const motivationMessage = useMemo(() => {
    if (!isToday(selectedDate)) return null;
    const p = todaysTaskProgress;
    if (p && p.total > 0) {
      return getMotivationMessage(now, p.total, p.crushed, lectureCount);
    }
    return getMotivationMessage(now, sortedEvents.length, pastItems.length, lectureCount);
  }, [selectedDate, now, sortedEvents.length, pastItems.length, lectureCount, todaysTaskProgress]);

  const dailyNarrative = useMemo(
    () => getDailyNarrative(selectedDate, sortedEvents),
    [selectedDate, sortedEvents]
  );

  const nextItemForNow = useMemo(
    () => (sortedEvents || []).find((e) => new Date(e.start_time) > now) ?? null,
    [sortedEvents, now]
  );

  const mostUrgentDeadline = useMemo(() => {
    const list = (upcomingDeadlines || []).filter((d) => d.start_due_date);
    if (list.length === 0) return null;
    return [...list].sort((a, b) => new Date(a.start_due_date) - new Date(b.start_due_date))[0];
  }, [upcomingDeadlines]);

  const hasDeadlineWithin24h = useMemo(() => {
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return (upcomingDeadlines || []).some(
      (d) => d.start_due_date && (new Date(d.start_due_date) - nowMs) <= oneDayMs && (new Date(d.start_due_date) - nowMs) >= 0
    );
  }, [upcomingDeadlines]);

  const seedsCountFromTasks = useMemo(() => {
    if (!isToday(selectedDate)) return 0;
    const todayStart = new Date(selectedDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(selectedDate);
    todayEnd.setHours(23, 59, 59, 999);
    const dueToday = (t) => {
      const d = t.due_date ? new Date(t.due_date) : null;
      return d && d >= todayStart && d <= todayEnd;
    };
    return (allTasks || []).filter((t) => {
      if (!t.completed) return false;
      const title = (t.title || "").toLowerCase();
      if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title)) return false;
      const completedAt = t.completed_at ?? t.completedAt;
      if (completedAt) return isToday(new Date(completedAt));
      return dueToday(t);
    }).length;
  }, [selectedDate, allTasks]);

  /* Seeds per day for last 35 days (7×5 grid): Garden Growth Streak heatmap */
  const seedsPerDayGrid = useMemo(() => {
    const grid = [];
    const isRoutine = (t) => /breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test((t.title || "").toLowerCase());
    const dayCounts = new Array(35).fill(0);
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    (allTasks || []).forEach((t) => {
      if (!t.completed) return;
      if (isRoutine(t)) return;
      const completedAt = t.completed_at ?? t.completedAt;
      const d = completedAt ? new Date(completedAt) : (t.due_date ? new Date(t.due_date) : null);
      if (!d) return;
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((todayStart - d) / (24 * 60 * 60 * 1000));
      if (diffDays >= 0 && diffDays < 35) dayCounts[34 - diffDays] += 1;
    });
    for (let row = 0; row < 5; row++) {
      const r = [];
      for (let col = 0; col < 7; col++) r.push(dayCounts[row * 7 + col] ?? 0);
      grid.push(r);
    }
    return grid;
  }, [allTasks]);

  /* Seeds harvested per day this week (Mon–Sun) — uses shared lib for Analytics bridge */
  const seedsPerDayThisWeek = useMemo(
    () => getSeedsPerDayThisWeek(allTasks, (t) => isRoutineOrEventTask(t, getTag)),
    [allTasks, getTag]
  );

  /* Last 35 days seed counts (index 0 = 35 days ago, 34 = today) for streak & total */
  const seedsPerDayLast35 = useMemo(() => {
    const dayCounts = new Array(35).fill(0);
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const isRoutine = (t) => isRoutineOrEventTask(t, getTag);
    (allTasks || []).forEach((t) => {
      if (!t.completed || isRoutine(t)) return;
      const completedAt = t.completed_at ?? t.completedAt;
      const d = completedAt ? new Date(completedAt) : (t.due_date ? new Date(t.due_date) : null);
      if (!d) return;
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((todayStart - d) / (24 * 60 * 60 * 1000));
      if (diffDays >= 0 && diffDays < 35) dayCounts[34 - diffDays] += 1;
    });
    return dayCounts;
  }, [allTasks, getTag]);

  const totalSeedsGrown = useMemo(
    () => seedsPerDayLast35.reduce((a, b) => a + b, 0),
    [seedsPerDayLast35]
  );

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = 34; i >= 0; i--) {
      if (seedsPerDayLast35[i] >= 1) streak += 1;
      else break;
    }
    return streak;
  }, [seedsPerDayLast35]);

  const hasOverdueToday = useMemo(() => {
    const now = new Date();
    return tasksDueToday.some(
      (t) =>
        !isRoutineOrEventTask(t, getTag) &&
        !t.completed &&
        t.due_date &&
        new Date(t.due_date) < now
    );
  }, [tasksDueToday, getTag]);

  const overdueTasksForNow = useMemo(() => {
    const now = new Date();
    return (filteredTasksDueToday || [])
      .filter(
        (t) =>
          !isRoutineOrEventTask(t, getTag) &&
          !t.completed &&
          t.due_date &&
          new Date(t.due_date) < now
      )
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [filteredTasksDueToday, getTag]);

  /* Tasks due today, remaining (due_date >= now, for Action Hub "Today's Remaining" zone) */
  const tasksRemainingToday = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    return (filteredTasksDueToday || [])
      .filter(
        (t) =>
          !t.completed &&
          !isRoutineOrEventTask(t, getTag) &&
          t.due_date &&
          (() => {
            const d = new Date(t.due_date);
            return d >= now && d <= todayEnd;
          })()
      )
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 8);
  }, [selectedDate, filteredTasksDueToday, getTag]);

  /** Today's Action Hub: tasks (to-do only, no routine) + major academic/work events only; sorted by time; excludes routine (meals, sleep, commute). */
  const actionHubList = useMemo(() => {
    if (!isToday(selectedDate)) return [];
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const tasks = (filteredTasksDueToday || [])
      .filter((t) => !isRoutineOrEventTask(t, getTag))
      .map((t) => {
        const due = t.due_date ? new Date(t.due_date) : null;
        const isOverdue = !t.completed && due && due < now;
        let actionHubStatus = "upcoming";
        if (t.completed) actionHubStatus = "completed";
        else if (isOverdue) actionHubStatus = "overdue";
        return {
          type: "task",
          id: `task-${t.id}`,
          sortTime: due || todayEnd,
          endTime: due ? new Date(due.getTime() + (t.estimated_blocks || 1) * 25 * 60000) : todayEnd,
          isOverdue,
          actionHubStatus,
          ...t,
        };
      });

    const futureTasks = tasks.filter(
      (t) => !t.completed && t.sortTime >= now && t.sortTime <= todayEnd
    );
    const nowTask = futureTasks.sort(
      (a, b) => new Date(a.sortTime).getTime() - new Date(b.sortTime).getTime()
    )[0];
    if (nowTask) nowTask.actionHubStatus = "now";

    const events = (sortedEvents || [])
      .filter(isMajorAcademicOrWorkEvent)
      .map((e) => {
        const start = e.start_time ? new Date(e.start_time) : null;
        const end = e.end_time ? new Date(e.end_time) : null;
        const isPast = end ? end < now : start ? start < now : false;
        return {
          type: "event",
          id: `event-${e.id}`,
          sortTime: start || now,
          endTime: end || start || now,
          isPast,
          title: e.title,
          start_time: e.start_time,
          end_time: e.end_time,
          location: e.location,
          link: e.link || e.url,
          ...e,
        };
      });

    const sorted = [...tasks, ...events].sort((a, b) => {
      const aFirst = a.isOverdue ? 0 : 1;
      const bFirst = b.isOverdue ? 0 : 1;
      if (aFirst !== bFirst) return aFirst - bFirst;
      return new Date(a.sortTime).getTime() - new Date(b.sortTime).getTime();
    });

    /* Partition: remaining first, then done so completed tasks move to bottom. */
    const remaining = sorted.filter(
      (i) => (i.type === "task" && !i.completed) || (i.type === "event" && !i.isPast)
    );
    const done = sorted.filter(
      (i) => (i.type === "task" && i.completed) || (i.type === "event" && i.isPast)
    );
    const sortedWithDoneAtBottom = [...remaining, ...done];

    const withGaps = [];
    for (let i = 0; i < sortedWithDoneAtBottom.length; i++) {
      if (i > 0) {
        const prev = sortedWithDoneAtBottom[i - 1];
        const curr = sortedWithDoneAtBottom[i];
        const prevEnd = prev.endTime ? new Date(prev.endTime).getTime() : new Date(prev.sortTime).getTime();
        const currStart = new Date(curr.sortTime).getTime();
        const gapMins = (currStart - prevEnd) / 60000;
        if (gapMins >= 30) {
          withGaps.push({ type: "gap", id: `gap-${i}`, durationMins: Math.round(gapMins) });
        }
      }
      withGaps.push(sortedWithDoneAtBottom[i]);
    }
    return withGaps;
  }, [selectedDate, filteredTasksDueToday, sortedEvents, getTag]);

  /** Show Zen when no items or all done (ignore gap items for done count). */
  const actionHubItemsOnly = useMemo(
    () => actionHubList.filter((i) => i.type === "task" || i.type === "event"),
    [actionHubList]
  );
  const actionHubAllDone = useMemo(
    () =>
      actionHubItemsOnly.length === 0 ||
      actionHubItemsOnly.every((i) => (i.type === "task" ? i.completed : i.isPast)),
    [actionHubItemsOnly]
  );
  const actionHubCompletedCount = useMemo(
    () => actionHubItemsOnly.filter((i) => (i.type === "task" ? i.completed : i.isPast)).length,
    [actionHubItemsOnly]
  );
  const actionHubSpineCompletedPct =
    actionHubItemsOnly.length > 0 ? (actionHubCompletedCount / actionHubItemsOnly.length) * 100 : 0;
  const actionHubRemainingCount = actionHubItemsOnly.filter(
    (i) => (i.type === "task" && !i.completed) || (i.type === "event" && !i.isPast)
  ).length;

  /** Smart Re-plan: move missed (non-routine) events and overdue tasks into nearest future free windows today. */
  const [replanLoading, setReplanLoading] = useState(false);
  const handleReplanDay = useCallback(async () => {
    const missedTasksOnly = missedItems.filter((item) => !isRoutineEvent(item));
    const overdueTasks = overdueTasksForNow || [];
    const hasMissed = missedTasksOnly.length > 0;
    const hasOverdueTasks = overdueTasks.length > 0;
    if (!hasMissed && !hasOverdueTasks) {
      showToast("Nothing to re-plan.");
      return;
    }
    const windows = getAllFreeWindowsToday(sortedEvents, selectedDate);
    if (windows.length === 0) {
      showToast("No free windows left today. Try re-scheduling for tomorrow.");
      return;
    }
    setReplanLoading(true);
    try {
      const windowCopies = windows.map((w) => ({
        start: new Date(w.start.getTime()),
        end: new Date(w.end.getTime()),
        minutes: w.minutes,
      }));
      let assignedCount = 0;
      for (const item of [...missedTasksOnly].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))) {
        const end = item.end_time ? new Date(item.end_time) : new Date(item.start_time);
        const durationMins = Math.round((end - new Date(item.start_time)) / 60000) || 25;
        const win = windowCopies.find((w) => w.minutes >= durationMins);
        if (!win) continue;
        const slotStart = new Date(win.start.getTime());
        const slotEnd = new Date(win.start.getTime() + durationMins * 60000);
        await editEvent(extractBaseEventId(item.id), {
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
        });
        win.start = slotEnd;
        win.minutes -= durationMins;
        assignedCount += 1;
      }
      for (const task of overdueTasks) {
        const durationMins = (task.estimated_blocks || 1) * 25;
        const win = windowCopies.find((w) => w.minutes >= durationMins);
        if (!win) continue;
        const slotStart = new Date(win.start.getTime());
        const slotEnd = new Date(win.start.getTime() + durationMins * 60000);
        await addEvent({
          title: task.title,
          description: task.description || "",
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
        });
        win.start = slotEnd;
        win.minutes -= durationMins;
        assignedCount += 1;
      }
      await loadEvents();
      refetchTasks();
      showToast(
        assignedCount > 0
          ? `Re-planned ${assignedCount} item${assignedCount === 1 ? "" : "s"} into your day.`
          : "No items could fit in remaining windows."
      );
    } catch {
      showToast("Couldn't re-plan. Try again.");
    } finally {
      setReplanLoading(false);
    }
  }, [missedItems, overdueTasksForNow, sortedEvents, selectedDate, editEvent, addEvent, loadEvents, showToast, refetchTasks]);

  /** Plan timeline: total focus window minutes (gaps >= 30 min between events today) for daily summary. */
  const planTimelineFocusWindowMinutes = useMemo(() => {
    if (!isToday(selectedDate) || !sortedEvents?.length) return 0;
    const dayStart = new Date(selectedDate);
    dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);
    const inWindow = sortedEvents.filter((e) => {
      const s = new Date(e.start_time).getTime();
      const eEnd = new Date(e.end_time || e.start_time).getTime();
      return eEnd > dayStart.getTime() && s < dayEnd.getTime();
    }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    let total = 0;
    let lastEnd = dayStart.getTime();
    for (const ev of inWindow) {
      const start = new Date(ev.start_time).getTime();
      const end = new Date(ev.end_time || ev.start_time).getTime();
      const gapMins = (start - lastEnd) / 60000;
      if (gapMins >= 30) total += Math.round(gapMins);
      if (end > lastEnd) lastEnd = end;
    }
    const tailMins = (dayEnd.getTime() - lastEnd) / 60000;
    if (tailMins >= 30) total += Math.round(tailMins);
    return total;
  }, [selectedDate, sortedEvents]);

  /** Remaining focus window minutes (future gaps only) and predicted finish time for today. */
  const planTimelinePredictedFinish = useMemo(() => {
    if (!isToday(selectedDate) || !sortedEvents?.length) return { remainingMins: 0, predictedFinishTime: null };
    const now = new Date();
    const dayStart = new Date(selectedDate);
    dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);
    if (now >= dayEnd) return { remainingMins: 0, predictedFinishTime: null };
    const inWindow = sortedEvents.filter((e) => {
      const s = new Date(e.start_time).getTime();
      const eEnd = new Date(e.end_time || e.start_time).getTime();
      return eEnd > dayStart.getTime() && s < dayEnd.getTime();
    }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    let remaining = 0;
    let lastEnd = dayStart.getTime();
    for (const ev of inWindow) {
      const start = new Date(ev.start_time).getTime();
      const end = new Date(ev.end_time || ev.start_time).getTime();
      const gapMins = (start - lastEnd) / 60000;
      const gapEnd = lastEnd + gapMins * 60000;
      if (gapMins >= 30 && gapEnd > now.getTime()) {
        const startInGap = Math.max(lastEnd, now.getTime());
        remaining += Math.round((gapEnd - startInGap) / 60000);
      }
      if (end > lastEnd) lastEnd = end;
    }
    const tailMins = (dayEnd.getTime() - lastEnd) / 60000;
    const tailEnd = lastEnd + tailMins * 60000;
    if (tailMins >= 30 && tailEnd > now.getTime()) {
      const startInTail = Math.max(lastEnd, now.getTime());
      remaining += Math.round((tailEnd - startInTail) / 60000);
    }
    const predictedFinishTime = remaining > 0
      ? (() => {
          const finish = new Date(now.getTime() + remaining * 60000);
          return `${String(finish.getHours()).padStart(2, "0")}:${String(finish.getMinutes()).padStart(2, "0")}`;
        })()
      : null;
    return { remainingMins: remaining, predictedFinishTime };
  }, [selectedDate, sortedEvents]);

  /** Aliases for legacy/cached references (actionHubFocusWindowMinutes, actionHubReadItem). */
  const actionHubFocusWindowMinutes = planTimelineFocusWindowMinutes;
  const actionHubReadItem = planTimelineReadItem;
  const actionHubFocusHours = planTimelineFocusWindowMinutes / 60;

  const prevSeedsCountRef = useRef(seedsCountFromTasks);
  const [seedsBounce, setSeedsBounce] = useState(false);
  useEffect(() => {
    if (!isToday(selectedDate)) return;
    try {
      if (localStorage.getItem("evolution_sapling_seen") === "1") return;
    } catch (_) {}
    if (seedsCountFromTasks > prevSeedsCountRef.current) {
      const prev = prevSeedsCountRef.current;
      if (getSaplingCelebrationCrossed(prev, seedsCountFromTasks)) {
        showLevelUpToast(getSaplingCelebrationMessage());
        try {
          localStorage.setItem("evolution_sapling_seen", "1");
        } catch (_) {}
      } else {
        const threshold = getLevelUpThresholdCrossed(prev, seedsCountFromTasks);
        if (threshold) showLevelUpToast(getLevelUpMessageForThreshold(threshold));
      }
      setSeedsBounce(true);
      const t = setTimeout(() => setSeedsBounce(false), 500);
      prevSeedsCountRef.current = seedsCountFromTasks;
      return () => clearTimeout(t);
    } else {
      prevSeedsCountRef.current = seedsCountFromTasks;
    }
  }, [seedsCountFromTasks, selectedDate, showLevelUpToast]);

  const handleHarvestToggle = useCallback(
    async (task, completed) => {
      const markingComplete = completed === true;
      const isRoutine = isRoutineHarvestTask(task);
      if (markingComplete) {
        if (!isRoutine) setCelebratingTaskId(task.id);
        showHarvestToast(getHarvestMessage(task), { isRoutine });
        if (!isRoutine) setTimeout(() => setCelebratingTaskId(null), 500);
      }
      try {
        await updateTask(task.id, { completed });
        refetchTasks();
      } catch (_) {}
    },
    [refetchTasks, showHarvestToast]
  );

  return (
    <div className={styles.page}>
      {toast && (
    <div className={styles.alertToast}>
      <div className={styles.alertContent}>
        <span className={styles.alertIcon}>✓</span>
        <span className={styles.alertMessage}>{toast}</span>
      </div>
      <button className={styles.alertClose} onClick={() => setToast(null)}>✕</button>
    </div>
  )}

      <DateNavigator
        date={selectedDate}
        onChange={setSelectedDate}
        scheduleTitle={scheduleTitle}
      />

      <div className={`${styles.bentoGrid} ${hasTimerSession ? styles.focusModeActive : ""}`}>
        {/* Top Triage Row: Hero + Action Hub (left) | Deadlines (center) */}
        <div className={styles.triageRow}>
          {/* Left: Hero (compact) + Action Hub stacked */}
          <div className={styles.triageLeft}>
            {/* Hero: compact NOW unit — glass, tank left, vibe/coaching right */}
            {(() => {
              const nowVibe = !hasTimerSession && isToday(selectedDate) && (sortedEvents || []).length > 0
                ? getNowVibe(now, selectedDate, sortedEvents || [], isToday)
                : null;
              const heroVibeClass = nowVibe?.type === "gap" || nowVibe?.type === "endOfDay"
                ? styles.heroVibeGap
                : nowVibe?.type === "focus"
                  ? styles.heroVibeFocus
                  : "";
              return (
            <div className={`${styles.triageHero} ${hasTimerSession ? styles.heroDeepWork : heroVibeClass}`.trim()} ref={nowCardRef}>
              {hasTimerSession ? (
                <>
                  <div className={styles.nowHeroTankWrap}>
                    <LiquidProgressTank
                      completed={goalsOnlyProgress?.crushed ?? 0}
                      total={goalsOnlyProgress?.total ?? 0}
                      isPomodoroRunning={timerActive}
                      isPaused={hasTimerSession && !timerActive}
                      size={130}
                    />
                  </div>
                  <div className={styles.triageHeroNowNext}>
                    {hasTimerSession && (
                      <p className={styles.heroVibeMessage}>
                        {timerActive
                          ? "Deep work in progress. You've got this. 🌊"
                          : "Pause taken. The garden is holding your spot. ✨"}
                      </p>
                    )}
                    <div className={styles.triageHeroNowRow}>
                      <span className={styles.triageHeroPulsingDot} aria-hidden />
                      <span className={styles.triageHeroLabelNow}>NOW</span>
                    </div>
                    <p className={styles.triageHeroValue}>{timerMode === "break" ? "Break" : (timerTask || "Focus")}</p>
                    <p className={styles.triageHeroCountdown} aria-live="polite">
                      {(() => {
                        const m = Math.floor(timeLeft / 60);
                        const s = timeLeft % 60;
                        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
                      })()}
                    </p>
                    <div className={styles.heroSessionProgressWrap}>
                      <div
                        className={styles.heroSessionProgressBar}
                        role="progressbar"
                        aria-valuenow={Math.round(typeof timerProgress === "number" ? timerProgress : 0)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={styles.heroSessionProgressFill}
                          style={{ width: `${Math.min(100, Math.max(0, typeof timerProgress === "number" ? timerProgress : 0))}%` }}
                        />
                      </div>
                    </div>
                    <div className={styles.heroSessionActions}>
                      <button type="button" className={styles.heroSessionBtnGhost} onClick={() => setTimerActive(!timerActive)} aria-label={timerActive ? "Pause" : "Resume"}>
                        {timerActive ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        className={styles.heroSessionBtnGhost}
                        onClick={() => {
                          setTimerActive(false);
                          setTimeLeft(timerMode === "work" ? (workTime || 25) * 60 : (breakTime || 5) * 60);
                        }}
                        aria-label="Restart timer"
                      >
                        Restart
                      </button>
                      <button
                        type="button"
                        className={styles.heroSessionBtnEnd}
                        onClick={() => { resetTimer(); setTimerTask(""); setActiveTaskId?.(null); }}
                        aria-label="End session"
                      >
                        End Session
                      </button>
                      <button
                        type="button"
                        className={styles.heroSessionBtnSecondary}
                        onClick={() => { navigate("/timer", { state: { fromTaskPlay: true } }); onNavigate?.("timer"); }}
                      >
                        Open Full Timer ↗
                      </button>
                    </div>
                  </div>
                    {showXPSparks && (
                      <div className={styles.xpSparksWrap} aria-hidden>
                        {Array.from({ length: 10 }, (_, i) => (
                          <span
                            key={i}
                            className={styles.xpSpark}
                            style={{
                              left: `${15 + (i * 7) + (i % 2) * 5}%`,
                              top: `${25 + (i % 5) * 12}%`,
                              animationDelay: `${i * 0.05}s`,
                            }}
                          >
                            +1
                          </span>
                        ))}
                      </div>
                    )}
                </>
              ) : (
                <>
                  {(() => {
                    const headsUp = isToday(selectedDate)
                      ? getNowHeadsUp(now, selectedDate, sortedEvents || [], isToday)
                      : { message: "Select today to see your flow", upNext: null };
                    const isGapState = (sortedEvents || []).length > 0 && headsUp.upNext;
                    return (
                      <>
                        <div className={`${styles.nowHeroTankWrap} ${styles.swirl}`}>
                          <LiquidProgressTank
                            completed={goalsOnlyProgress?.crushed ?? 0}
                            total={goalsOnlyProgress?.total ?? 0}
                            goalsCrushed={goalsOnlyProgress?.crushed}
                            isPomodoroRunning={false}
                            isPaused={false}
                            isGapActive={!!isGapState}
                            isSwirl={nowHeroFocusBtnHovered}
                            size={130}
                          />
                        </div>
                        <div className={styles.triageHeroNowNext}>
                          {isToday(selectedDate) && (() => {
                            const currentBlock = (sortedEvents || []).find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time));
                            const progress = currentBlock ? getNowLinePercent(currentBlock.start_time, currentBlock.end_time) : null;
                            return progress != null ? (
                              <div className={styles.heroDayProgressWrap} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                                <div className={styles.heroDayProgressFill} style={{ width: `${progress}%` }} />
                              </div>
                            ) : null;
                          })()}
                          <div className={styles.heroVibeMessageRow}>
                            <p className={styles.heroVibeMessage}>
                              {headsUp.timeInMessage ? (
                                <>
                                  {headsUp.message.split("[TIME]")[0]}
                                  <span className={styles.heroTimeMono}>{headsUp.timeInMessage}</span>
                                  {headsUp.message.split("[TIME]")[1]}
                                </>
                              ) : (
                                headsUp.message
                              )}
                            </p>
                          </div>
                          {(() => {
                            const currentBlock = (sortedEvents || []).find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time));
                            const countdownStr = scheduleCountdownSecs != null && isToday(selectedDate) ? formatScheduleCountdown(scheduleCountdownSecs) : null;
                            const showNow = !!currentBlock;
                            const showUpcoming = !!headsUp.upNext;
                            if (!showNow && !showUpcoming) return null;
                            return (
                              <div className={styles.heroNowUpcomingStack}>
                                {showNow && (
                                  <p className={styles.heroNowUpcomingLine}>
                                    <span className={styles.heroNowUpcomingLabel}>NOW</span>
                                    <span className={styles.heroNowUpcomingTaskName}>
                                      {currentBlock.title?.trim() || "Focus"}
                                    </span>
                                  </p>
                                )}
                                {showUpcoming && (
                                  <p className={styles.heroNowUpcomingLine}>
                                    <span className={styles.heroNowUpcomingLabel}>UPCOMING</span>
                                    <span className={styles.heroNowUpcomingTaskName}>
                                      {headsUp.upNext.title}
                                    </span>
                                    {countdownStr ? (
                                      <span className={styles.heroNowUpcomingTimerWrap}>
                                        <span className={styles.heroCountdownIn}>in</span>{" "}
                                        <span className={styles.heroCountdownMono} aria-live="polite">
                                          {countdownStr}
                                        </span>
                                      </span>
                                    ) : (
                                      headsUp.upNext.time && (
                                        <span className={styles.heroNowUpcomingTimerWrap}>
                                          <span className={styles.heroTimeMono}>
                                            {formatTimeHHMM(headsUp.upNext.time)}
                                          </span>
                                        </span>
                                      )
                                    )}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                          {isToday(selectedDate) && (
                            <button
                              type="button"
                              className={styles.smartInsightStartBtn}
                              onClick={startFocusInWidget}
                              onMouseEnter={() => setNowHeroFocusBtnHovered(true)}
                              onMouseLeave={() => setNowHeroFocusBtnHovered(false)}
                              aria-label="Start focus session"
                            >
                              Ready to Focus? ⚡
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          );
          })()}

            {/* Today's Action Hub: execution list — tasks + major academic/work events only; no internal scroll */}
            <div className={styles.actionHub} ref={actionHubRef}>
              <div className={styles.actionHubHeaderRow}>
                <h3 className={styles.actionHubTitle}>Today&apos;s Action Hub</h3>
                {!actionHubAllDone && (
                  <Link to="/tasks" className={styles.actionHubHeaderLink}>
                    Manage all tasks →
                  </Link>
                )}
              </div>
              {isToday(selectedDate) && (actionHubFocusHours > 0 || actionHubRemainingCount > 0) && (
                <div className={styles.actionHubStatusBar}>
                  <div className={styles.actionHubStatusPill}>
                    <span className={styles.actionHubStatusStat}>
                      {actionHubFocusHours < 1 ? `${Math.round(planTimelineFocusWindowMinutes)} min` : `${actionHubFocusHours.toFixed(1)}h`} focused work
                    </span>
                    <span className={styles.actionHubStatusDivider} aria-hidden>·</span>
                    <span className={styles.actionHubStatusStat}>
                      <strong>{actionHubRemainingCount}</strong> {actionHubRemainingCount === 1 ? "task" : "tasks"} remaining
                    </span>
                  </div>
                  <div className={styles.actionHubProgressTrack} aria-hidden>
                    <div
                      className={styles.actionHubProgressFill}
                      style={{ width: `${actionHubSpineCompletedPct}%` }}
                    />
                  </div>
                </div>
              )}
              {!actionHubAllDone && actionHubItemsOnly.length > 0 ? (
                <>
                  <div className={styles.actionHubSpineWrap} aria-hidden>
                    <div
                      className={styles.actionHubSpineSolid}
                      style={{ height: `${actionHubSpineCompletedPct}%` }}
                    />
                    <div
                      className={styles.actionHubSpineDashed}
                      style={{
                        top: `${actionHubSpineCompletedPct}%`,
                        height: `${100 - actionHubSpineCompletedPct}%`,
                      }}
                    />
                  </div>
                  <motion.ul className={styles.actionHubCardList} layout>
                    {actionHubList.map((item) => {
                      if (item.type === "gap") {
                        const hrs = Math.floor(item.durationMins / 60);
                        const mins = item.durationMins % 60;
                        const label = hrs > 0 ? `${hrs}h ${mins}m` : `${item.durationMins}m`;
                        return (
                          <motion.li key={item.id} className={styles.actionHubGapRow} aria-hidden layout>
                            <span className={styles.actionHubGapText}>✨ {label} Focus Gap</span>
                          </motion.li>
                        );
                      }
                      if (item.type === "event") {
                        const isPast = item.isPast;
                        const timeStr = item.start_time ? formatTime(item.start_time) : "";
                        const endStr = item.end_time && item.end_time !== item.start_time ? ` – ${formatTime(item.end_time)}` : "";
                        return (
                          <motion.li
                            key={item.id}
                            layout
                            className={`${styles.actionHubCard} ${styles.actionHubCardEvent} ${isPast ? styles.actionHubCardCompleted : ""}`}
                          >
                            <div className={styles.actionHubCardPillWrap} />
                            <div className={styles.actionHubCardBody}>
                              <div className={styles.actionHubCardRow}>
                                <span className={styles.actionHubEventIcon} aria-hidden title="Academic/Work">📚</span>
                                {(item.location || item.link) && (
                                  <span className={styles.actionHubEventLocation}>
                                    {item.link ? (
                                      <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.actionHubEventLink}>Link</a>
                                    ) : (
                                      item.location
                                    )}
                                  </span>
                                )}
                                <span className={styles.actionHubCardTitle} title={item.title}>{item.title}</span>
                              </div>
                            </div>
                          </motion.li>
                        );
                      }

                      const t = item;
                      const isOverdue = t.actionHubStatus === "overdue";
                      const isNow = t.actionHubStatus === "now";
                      const isUpcoming = t.actionHubStatus === "upcoming";
                      const isCompleted = t.actionHubStatus === "completed";
                      const borderClass = getTaskCategoryColor(t) === "sage" ? styles.actionHubCardBorderSage : styles.actionHubCardBorderFlax;
                      return (
                        <motion.li
                          key={t.id}
                          layout
                          className={`${styles.actionHubCard} ${borderClass} ${
                            isOverdue ? styles.actionHubCardOverdue : ""
                          } ${isNow ? styles.actionHubCardNow : ""} ${
                            isUpcoming ? styles.actionHubCardUpcoming : ""
                          } ${isCompleted ? styles.actionHubCardCompleted : ""}`}
                        >
                          <div className={styles.actionHubCardPillWrap}>
                            {getTaskCategoryPillMeta(t) && (() => {
                              const meta = getTaskCategoryPillMeta(t);
                              const pillClass = meta.listId ? `${styles.actionHubModulePill} ${styles.actionHubModulePillList}` : styles.actionHubModulePill;
                              const content = <span className={pillClass}>{meta.label}</span>;
                              return meta.listId ? (
                                <Link to={`/tasks?list=${meta.listId}`} className={styles.actionHubPillLink}>{content}</Link>
                              ) : (
                                content
                              );
                            })()}
                            {isNow && !t.completed && (
                              <span className={styles.actionHubNowDot} aria-label="Current task" title="Now" />
                            )}
                            {isOverdue && !t.completed && (
                              <span className={styles.actionHubUrgentBadge}>URGENT</span>
                            )}
                          </div>
                          <div className={styles.actionHubCardBody}>
                            <div className={styles.actionHubCardRow}>
                              {!t.completed && (
                                <button
                                  type="button"
                                  className={styles.actionHubCheckbox}
                                  onClick={(e) => { e.stopPropagation(); handleActionHubComplete(t); }}
                                  aria-label={`Complete ${t.title}`}
                                  title="Complete"
                                >
                                  <span className={styles.actionHubCheckboxBoxRound} aria-hidden />
                                  {floatingSeedTaskId === t.id && (
                                    <motion.span
                                      className={styles.actionHubFloatingXp}
                                      initial={{ opacity: 1, y: 0 }}
                                      animate={{ opacity: 0, y: -24 }}
                                      transition={{ duration: 1, ease: "easeOut" }}
                                      aria-hidden
                                    >
                                      +{floatingSeedXp} XP
                                    </motion.span>
                                  )}
                                </button>
                              )}
                              {t.completed && <span className={styles.actionHubCardDone} aria-hidden>✓</span>}
                              <span className={styles.actionHubCardTitle} title={t.title}>{t.title}</span>
                              {!t.completed && isOverdue && (
                                <button
                                  type="button"
                                  className={styles.actionHubReschedule}
                                  onClick={(e) => { e.stopPropagation(); setRescheduleTask(t); }}
                                  aria-label={`Reschedule ${t.title}`}
                                  title="Reschedule"
                                >
                                  Reschedule
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                </>
              ) : (
                <>
                  <ZenGardenEmptyState
                    displayName={displayName}
                    sub={null}
                    message="The slate is clean. You've mastered your momentum for now. ✨"
                    action={
                      <Link to="/tasks" className={styles.actionHubLink}>
                        Manage all tasks →
                      </Link>
                    }
                  />
                </>
              )}
            </div>
          </div>

          {/* Deadlines: wide center, coral border, monospace countdowns — no Manage link here */}
          <div className={styles.triageDeadlines}>
            {(upcomingDeadlines || []).length > 0 ? (
              <DeadlinesWidget variant="triage" onModuleTagClick={handleModuleTagClick} />
            ) : (
              <div className={styles.triageDeadlinesEmpty}>
                <span className={styles.triageDeadlinesEmptyIcon} aria-hidden>🕐</span>
                <span>No upcoming deadlines</span>
              </div>
            )}
          </div>

        </div>

        {/* Spine: Timeline — no internal scroll; daily summary + read-first modal on card click */}
        <div className={styles.bentoSpine}>
          <div className={styles.timelineBox}>
            {isToday(selectedDate) && planTimelineFocusWindowMinutes > 0 && (
              <div className={styles.planTimelineStatusBar}>
                <span>
                  You have {planTimelineFocusWindowMinutes < 60
                    ? `${planTimelineFocusWindowMinutes} min`
                    : planTimelineFocusWindowMinutes % 60 === 0
                      ? `${planTimelineFocusWindowMinutes / 60} ${planTimelineFocusWindowMinutes / 60 === 1 ? "hour" : "hours"}`
                      : `${Math.floor(planTimelineFocusWindowMinutes / 60)}h ${planTimelineFocusWindowMinutes % 60}m`} of focus windows today.
                  {planTimelinePredictedFinish?.predictedFinishTime && (
                    <> With your current list, you could be done by {planTimelinePredictedFinish.predictedFinishTime}. </>
                  )}
                </span>
                <span className={styles.planTimelineStatusBarEmoji} aria-hidden>⚡</span>
              </div>
            )}
            <div className={styles.timelineHeader}>
              <div className={styles.timelineHeaderLeft}>
                <h3 className={styles.timelineTitle}>YOUR PLAN FOR THE DAY</h3>
                {!isToday(selectedDate) && <span className={styles.timelineSub}>Preview & adjust.</span>}
              </div>
              <div className={styles.timelineHeaderRight}>
                <Link to="/calendar" className={styles.timelineHeaderCta}>
                  View Detailed Planner →
                </Link>
                {isToday(selectedDate) && (missedItems?.length > 0 || (overdueTasksForNow?.length ?? 0) > 0) && (
                  <motion.button
                    type="button"
                    className={styles.replanBtn}
                    onClick={handleReplanDay}
                    disabled={replanLoading}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    aria-label="Re-plan overdue and missed items into free windows"
                  >
                    {replanLoading ? "Re-planning…" : "✨ Re-plan"}
                  </motion.button>
                )}
              </div>
            </div>
            <div className={styles.timelineTrack}>
              <div className={styles.timelineTrackLine} aria-hidden />
              <motion.div
                className={styles.timelineTrackContent}
                layout
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              >
                <MiniTimeline
                  sortedEvents={sortedEvents}
                  selectedDate={selectedDate}
                  now={now}
                  dayTasks={dayTasks}
                  tasksDueToday={filteredTasksDueToday}
                  suggestableTasks={suggestableTasks}
                  taskLists={taskLists}
                  onQuickStart={handleQuickStartGap}
                  onHarvestToggle={handleHarvestToggle}
                  onCardClick={(ev, matchTask) => setPlanTimelineReadItem({ event: ev, task: matchTask ?? null })}
                  onEdit={(ev) => openModal(ev, ev.tag)}
                  onConflictAutoMove={handleConflictAutoMove}
                  onDelete={removeEvent}
                  onReschedule={handleReschedule}
                  getTag={getTag}
                />
              </motion.div>
            </div>
          </div>
        </div>

        <div className={styles.bentoRight}>
          <div className={styles.enrollmentCard}>
            <h3 className={styles.enrollmentTitle}>Active Enrollment</h3>
            <div className={styles.enrollmentNumberWrap}>
              <span className={styles.enrollmentNumber} aria-hidden>
                {(enrolledModules || []).length}
              </span>
              <p className={styles.enrollmentNumberLabel}>Modules</p>
            </div>
            <div className={styles.enrollmentDots} aria-hidden>
              <span className={styles.enrollmentDotSage} />
              <span className={styles.enrollmentDotFlax} />
              <span className={styles.enrollmentDotEarth} />
            </div>
            <p className={styles.enrollmentQuestion}>Want to enroll in more?</p>
            <Link to="/modules?filter=enrolled" className={styles.enrollmentCta}>
              Manage Enrollments →
            </Link>
          </div>
        </div>

      </div>

      {showCreateTaskModal && (
        <CreateTaskModal
          lists={taskLists}
          modules={enrolledModules}
          onCreateList={async (data) => {
            const created = await createTaskList(data);
            const list = await fetchTaskLists();
            setTaskLists(Array.isArray(list) ? list : []);
            return created;
          }}
          onSave={async (data, opts) => {
            try {
              const dataToSend = { ...data };
              const titleLower = (data.title || "").toLowerCase();
              if (/breakfast|lunch|dinner|sleep|brunch|coffee|meal\s*prep/i.test(titleLower)) {
                const routineTag = (tags || []).find((t) => (t.label || t.name) === "Routine");
                if (routineTag) dataToSend.tag = routineTag.id;
              }
              const created = await createTask(dataToSend);
              refetchTasks();
              if (opts?.addToSchedule && created) {
                const start = new Date(selectedDate);
                start.setHours(9, 0, 0, 0);
                const mins = (data.estimated_blocks || 1) * 25;
                const end = new Date(start.getTime() + mins * 60000);
                await addEvent({
                  title: created.title,
                  start_time: start.toISOString(),
                  end_time: end.toISOString(),
                  description: created.description || "",
                });
              }
              showToast(opts?.addToSchedule && created ? `"${created.title}" added to today's schedule` : "Task added");
            } catch {
              showToast("Couldn't add task. Try again.");
            }
            setShowCreateTaskModal(false);
          }}
          onClose={() => setShowCreateTaskModal(false)}
          showAddToScheduleToggle={isToday(selectedDate)}
          addToScheduleLabel="Add to today's schedule"
        />
      )}

      {rescheduleTask && (
        <EditTaskModal
          task={rescheduleTask}
          onSave={async (data) => {
            try {
              await updateTask(rescheduleTask.id, data);
              refetchTasks();
              setRescheduleTask(null);
            } catch (_) {}
          }}
          onDelete={async () => {
            try {
              await deleteTask(rescheduleTask.id);
              refetchTasks();
              setRescheduleTask(null);
            } catch (_) {}
          }}
          onClose={() => setRescheduleTask(null)}
        />
      )}

      {planTimelineReadItem && (
        <div
          className={styles.actionHubReadOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-read-title"
          onClick={() => setPlanTimelineReadItem(null)}
        >
          <div
            className={styles.actionHubReadModal}
            onClick={(e) => e.stopPropagation()}
          >
            {planTimelineReadItem.task ? (
              <>
                <h2 id="plan-read-title" className={styles.actionHubReadTitle}>{planTimelineReadItem.task.title}</h2>
                <p className={styles.actionHubReadTime}>
                  {planTimelineReadItem.task.due_date ? formatTime(planTimelineReadItem.task.due_date) : ""}
                  {planTimelineReadItem.task.estimated_blocks && <> · {(planTimelineReadItem.task.estimated_blocks || 1) * 25}m</>}
                </p>
                {planTimelineReadItem.task.description && (
                  <p className={styles.actionHubReadDescription}>{planTimelineReadItem.task.description}</p>
                )}
                <div className={styles.actionHubReadFooter}>
                  <button type="button" className={styles.actionHubReadBtn} onClick={() => { setRescheduleTask(planTimelineReadItem.task); setPlanTimelineReadItem(null); }}>Edit</button>
                  <button type="button" className={styles.actionHubReadBtnDanger} onClick={async () => { try { await deleteTask(planTimelineReadItem.task.id); refetchTasks(); setPlanTimelineReadItem(null); } catch (_) {} }}>Delete</button>
                </div>
              </>
            ) : (
              <>
                <h2 id="plan-read-title" className={styles.actionHubReadTitle}>{planTimelineReadItem.event.title}</h2>
                <p className={styles.actionHubReadTime}>
                  {planTimelineReadItem.event.start_time ? formatTime(planTimelineReadItem.event.start_time) : ""}
                  {planTimelineReadItem.event.end_time && planTimelineReadItem.event.end_time !== planTimelineReadItem.event.start_time ? ` – ${formatTime(planTimelineReadItem.event.end_time)}` : ""}
                  {planTimelineReadItem.event.start_time && planTimelineReadItem.event.end_time && <> · {Math.round((new Date(planTimelineReadItem.event.end_time) - new Date(planTimelineReadItem.event.start_time)) / 60000)}m</>}
                </p>
                {planTimelineReadItem.event.description && (
                  <p className={styles.actionHubReadDescription}>{planTimelineReadItem.event.description}</p>
                )}
                <div className={styles.actionHubReadFooter}>
                  <button type="button" className={styles.actionHubReadBtn} onClick={() => { const ev = { ...planTimelineReadItem.event, id: extractBaseEventId(planTimelineReadItem.event.id) }; openModal(ev, planTimelineReadItem.event.tag); setPlanTimelineReadItem(null); }}>Edit</button>
                  <button type="button" className={styles.actionHubReadBtnDanger} onClick={async () => { try { await removeEvent(extractBaseEventId(planTimelineReadItem.event.id)); await loadEvents(); setPlanTimelineReadItem(null); } catch (_) {} }}>Delete</button>
                </div>
              </>
            )}
            <button type="button" className={styles.actionHubReadClose} onClick={() => setPlanTimelineReadItem(null)} aria-label="Close">×</button>
          </div>
        </div>
      )}

    </div>
  );
}