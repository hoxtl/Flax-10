/**
 * Homepage contextual message helpers. Pure functions only.
 */

import { isToday } from "../../../components/Calendar/utils/dateUtils";
import { formatTime, getTimeOfDay } from "./dateFormatUtils";

/** Contextual micro-copy for NOW widget when idle (no current block). */
export function getNowBannerIdleMessage({ nextItem, selectedDate, now: nowDate, hasOverdueToday }) {
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
export function getGreetingCopy({ sessionsDone, narrative, now, selectedDate }) {
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
  return "Focus paused. Ready to build more progress?";
}

/** Context-aware motivation header for Plan for the Day. */
export function getMotivationMessage(currentTime, totalTasks, completedTasks, lectureCount) {
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
