/*
 * Gap-assignment helpers for the mini timeline.
 */

import { getTasksThatFitGap, taskDurationMins } from "../../utils/taskUtils";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

function getDueTime(task) {
  return task?.due_date ? new Date(task.due_date).getTime() : Number.MAX_SAFE_INTEGER;
}

function compareTaskPriority(a, b) {
  const dueDelta = getDueTime(a) - getDueTime(b);
  if (dueDelta !== 0) return dueDelta;
  return (PRIORITY_ORDER[a?.priority] ?? 2) - (PRIORITY_ORDER[b?.priority] ?? 2);
}

function getGapScore(row, suggested, now) {
  const due = suggested?.due_date ? new Date(suggested.due_date) : null;
  const overdueBoost = due && due < now ? 240 : 0;
  const urgentBoost = suggested?.priority === "urgent" ? 140 : suggested?.priority === "high" ? 70 : 0;
  return (row.minutes || 0) + overdueBoost + urgentBoost;
}

function getTaskRank(task, gapMins, now) {
  const due = task?.due_date ? new Date(task.due_date) : null;
  const durationFit = Math.abs((gapMins || 0) - taskDurationMins(task));
  return [
    due && due < now ? 0 : 1,
    PRIORITY_ORDER[task?.priority] ?? 2,
    durationFit,
    -taskDurationMins(task),
  ];
}

function compareRank(a, b) {
  const firstDifferenceIndex = a.findIndex((value, index) => value !== b[index]);
  if (firstDifferenceIndex === -1) return 0;
  return a[firstDifferenceIndex] - b[firstDifferenceIndex];
}

function isTaskAvailable(task, usedIds, slottedTaskIds, slottedTitles, skipped, minutes) {
  if (usedIds.has(task.id) || slottedTaskIds.has(task.id) || slottedTitles.has(task.title)) return false;
  if (skipped?.has(task.id)) return false;
  return Boolean(getTasksThatFitGap([task], minutes).suggested);
}

function getSortedFreeRows(rows) {
  return rows
    .filter((row) => row.type === "free")
    .sort((a, b) => (a.gapStartMins ?? a.startMins ?? 0) - (b.gapStartMins ?? b.startMins ?? 0));
}

function getQueue(tasks) {
  return [...(tasks || [])].filter((task) => !task?.completed).sort(compareTaskPriority);
}

export function deriveBestFreeRowId(rows, suggestableTasks, now) {
  const freeRows = rows.filter((row) => row.type === "free");
  const best = freeRows.reduce((winner, row) => {
    const { suggested } = getTasksThatFitGap(suggestableTasks || [], row.minutes || 0);
    const score = getGapScore(row, suggested, now);
    return score > winner.score ? { id: row.id, score } : winner;
  }, { id: null, score: -Infinity });
  return best.id;
}

export function deriveAssignedGapTasks(rows, suggestableTasks, now, skippedGapTasks, slottedTaskIds, slottedTitles) {
  const freeRows = getSortedFreeRows(rows);
  const queue = getQueue(suggestableTasks);
  const usedIds = new Set();
  const map = {};

  freeRows.forEach((row) => {
    const skipped = skippedGapTasks[row.id];
    const candidates = queue.filter((task) => isTaskAvailable(task, usedIds, slottedTaskIds, slottedTitles, skipped, row.minutes || 0));
    const pick = candidates.sort((a, b) => compareRank(getTaskRank(a, row.minutes, now), getTaskRank(b, row.minutes, now)))[0];
    if (!pick) return;
    map[row.id] = pick;
    usedIds.add(pick.id);
  });

  const nextMap = Object.fromEntries(freeRows.slice(0, -1).map((row, index) => [row.id, map[freeRows[index + 1].id] || null]));
  return { map, nextMap };
}

export function deriveGapDeadlineFallbacks(rows, assignedGapTasks, deadlineSuggestions, slottedTitles) {
  const freeRows = getSortedFreeRows(rows);
  const available = (deadlineSuggestions || []).filter((item) => !slottedTitles.has(`Revision: ${item.assessment_title || item.title}`));
  const map = {};
  let index = 0;
  freeRows.forEach((row) => {
    if (assignedGapTasks.map[row.id]) return;
    if (!available[index]) return;
    map[row.id] = available[index];
    index += 1;
  });
  return map;
}
