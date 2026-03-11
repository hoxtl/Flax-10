/**
 * Homepage task helpers. Pure functions only.
 */

import { getTaskDurationMinutes, getTasksThatFitWindow } from "../../../lib/focusPlanner";

/** Task duration in minutes: estimated_blocks (Pomodoro blocks) × 25. */
export function taskDurationMins(task) {
  return getTaskDurationMinutes(task);
}

/** Returns tasks that fit in gapMinutes. Prioritizes due within 48h, then urgency. */
export function getTasksThatFitGap(tasks, gapMinutes) {
  return getTasksThatFitWindow(tasks, gapMinutes);
}

/** Task is routine (meals/sleep) or event-like (lecture/seminar/tutorial). */
export function isRoutineOrEventTask(task, getTag) {
  if (!task) return false;
  const title = (task.title || "").toLowerCase();
  const tagLabel = (getTag && getTag(task.tag)?.label) || (task.tag_name || "").toString();
  const tagLower = tagLabel.toLowerCase();
  if (tagLower === "routine" || tagLower === "wellness" || tagLower === "event") return true;
  if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack|commute/i.test(title)) return true;
  if (/lecture|seminar|tutorial|lab\s*session/i.test(title)) return true;
  return false;
}

/** Seeds by category for Growth by Category: completed only, excluding routine. */
export function calculateSeedsByCategory(tasks, getTag) {
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

/** True if task is routine/event and its due time has passed — treat as "done". */
export function isAutoPassedTask(task, now = new Date(), getTag) {
  if (!isRoutineOrEventTask(task, getTag) || !task.due_date) return false;
  return new Date(task.due_date) < now;
}
