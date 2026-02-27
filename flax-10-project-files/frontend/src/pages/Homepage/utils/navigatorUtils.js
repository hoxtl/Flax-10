/**
 * Homepage Daily Navigator helpers. Pure functions only.
 */

import { isToday } from "../../../components/Calendar/utils/dateUtils";
import { isNow } from "./eventUtils";
import { getAllFreeWindowsToday } from "./slotUtils";
import { formatTime, formatTimeHHMM } from "./dateFormatUtils";
import { isLecture } from "./eventUtils";

/** Find overlapping event pairs in sorted events. Returns [{ a, b, overlapStart, overlapEnd }]. */
export function getOverlappingPairs(sortedEvents) {
  if (!sortedEvents?.length) return [];
  const pairs = [];
  const sorted = [...sortedEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const aEnd = new Date(a.end_time || a.start_time).getTime();
    const bStart = new Date(b.start_time).getTime();
    if (aEnd > bStart) {
      pairs.push({
        a,
        b,
        overlapStart: new Date(bStart),
        overlapEnd: new Date(Math.min(aEnd, new Date(b.end_time || b.start_time).getTime())),
      });
    }
  }
  return pairs;
}

/** Daily Navigator context: task/gap/conflict/endOfDay, currentBlock, nextItem, gapMins, overlaps. */
export function getNavigatorContext(now, selectedDate, sortedEvents, isTodayFn) {
  const defaultCtx = {
    state: "none",
    currentBlock: null,
    nextItem: null,
    gapMins: null,
    overlaps: [],
    conflictAt: null,
    firstGapWindow: null,
  };
  if (!isTodayFn(selectedDate) || !sortedEvents?.length) return defaultCtx;

  const overlaps = getOverlappingPairs(sortedEvents);
  const nowMs = now.getTime();
  const conflictNow = overlaps.find((p) => {
    const start = p.overlapStart.getTime();
    const end = p.overlapEnd.getTime();
    return nowMs >= start && nowMs <= end;
  });
  const conflictUpcoming = overlaps.find((p) => p.overlapStart.getTime() > nowMs);

  const currentBlock = sortedEvents.find((e) => e.start_time && e.end_time && isNow(e.start_time, e.end_time));
  const future = sortedEvents
    .filter((e) => e.start_time && new Date(e.start_time).getTime() > nowMs)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const nextItem = future[0] ?? null;
  const gapMs = nextItem ? new Date(nextItem.start_time).getTime() - nowMs : 0;
  const gapMins = Math.floor(gapMs / 60000);

  const windows = getAllFreeWindowsToday(sortedEvents, selectedDate);
  const firstGapWindow = windows[0] ?? null;

  if (conflictNow || conflictUpcoming) {
    const c = conflictNow || conflictUpcoming;
    return {
      ...defaultCtx,
      state: "conflict",
      currentBlock: conflictNow ? currentBlock : null,
      nextItem,
      overlaps,
      conflictAt: c.overlapStart,
    };
  }

  if (currentBlock) {
    return { ...defaultCtx, state: "task", currentBlock, nextItem, overlaps };
  }

  if (!nextItem) {
    return { ...defaultCtx, state: "endOfDay", overlaps };
  }

  return {
    ...defaultCtx,
    state: "gap",
    nextItem,
    gapMins,
    firstGapWindow: firstGapWindow?.minutes >= 15 ? firstGapWindow : null,
    overlaps,
  };
}

/** Soft-coaching "vibe" for NOW widget when idle. */
export function getNowVibe(now, selectedDate, sortedEvents, isTodayFn) {
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
    return { type: "gap", message: "A tiny pocket of peace. Time for a quick stretch or a tea refill?", icon: "✨", gapMins, nextItem };
  }
  if (gapMins <= 60) {
    return { type: "gap", message: "A golden window! Perfect for a 'Quick Win' or a cozy reset.", icon: "🌱", gapMins, nextItem };
  }
  return { type: "gap", message: "Wide open skies. Time for a deep-work sprint or some well-deserved rest.", icon: "☁️", gapMins, nextItem };
}

/** Context-aware heads-up for NOW hero. */
export function getNowHeadsUp(now, selectedDate, sortedEvents, isTodayFn, peakHours) {
  const defaultMessage = "Ready when you are. Your schedule is clear.";
  if (!isTodayFn(selectedDate) || !sortedEvents?.length) {
    return { message: defaultMessage, upNext: null };
  }
  const future = [...(sortedEvents || [])]
    .filter((e) => e.start_time && new Date(e.start_time).getTime() > now.getTime())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const nextItem = future[0] ?? null;
  const hour = now.getHours();
  const isPeakHour = peakHours?.some((p) => p.hour === hour);
  const rank = peakHours?.findIndex((p) => p.hour === hour);

  if (peakHours?.length && isPeakHour && rank === 0) {
    return {
      message: "You're in the zone! This is your #1 most productive hour. Push through that coursework! 🔥",
      upNext: nextItem ? { title: nextItem.title ?? "Block", time: nextItem.start_time } : null,
      isPeak: true,
    };
  }
  if (peakHours?.length && isPeakHour) {
    return {
      message: "Peak window! This is one of your top productivity hours. Great time for deep work. ⚡",
      upNext: nextItem ? { title: nextItem.title ?? "Block", time: nextItem.start_time } : null,
      isPeak: true,
    };
  }
  if (hour >= 13 && hour < 16 && !isPeakHour) {
    return {
      message: "This is usually a low-energy time for you. Perfect for admin tasks, emails, or a quick break. 📮",
      upNext: nextItem ? { title: nextItem.title ?? "Block", time: nextItem.start_time } : null,
    };
  }
  if (hour >= 14 && hour < 16) {
    return {
      message: "The mid-day lull is here. Maybe a quick 10-min reset before the next sprint? ☁️",
      upNext: nextItem ? { title: nextItem.title ?? "Block", time: nextItem.start_time } : null,
    };
  }
  if (nextItem && isLecture(nextItem)) {
    const nextStart = new Date(nextItem.start_time);
    const gapMins = (nextStart.getTime() - now.getTime()) / 60000;
    if (gapMins <= 60 && gapMins >= 0) {
      return {
        message: "Busy lecture ahead! Grab a coffee and get settled. ☕",
        upNext: { title: nextItem.title ?? "Lecture", time: nextItem.start_time },
      };
    }
  }
  if (sortedEvents.length > 5) {
    return {
      message: "It's a high-energy day ahead. Ready to tackle the peak? 🏔️",
      upNext: nextItem ? { title: nextItem.title ?? "Block", time: nextItem.start_time } : null,
    };
  }
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
  if (!nextItem) {
    return { message: "The sun is setting on your tasks. Rest well — your garden is proud of you. 🌙", upNext: null };
  }
  return {
    message: defaultMessage,
    upNext: nextItem ? { title: nextItem.title ?? "Block", time: nextItem.start_time } : null,
  };
}
