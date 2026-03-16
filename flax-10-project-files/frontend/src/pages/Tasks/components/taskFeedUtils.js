/**
 * Shared utility functions and constants for the Tasks feed.
 * Handles task sorting, list colour resolution, and routine-task detection.
 */

import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";
import {
  PRIORITY_ORDER,
  compareTaskPriority,
  compareTaskDue,
  compareTaskEstimatedTime,
} from "../../../lib/focusPlanner";
export { PRIORITY_ORDER };

/**
 * Returns true when a task is a routine or calendar event and should
 * be excluded from the overdue section.
 * @param {object} task
 */
export function isRoutineOrEventTask(task) {
  if (!task) return false;
  const title = (task.title || "").toLowerCase();
  const tag = (task.tag || "").toString().toLowerCase();
  if (tag === "routine" || tag === "event") return true;
  if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title)) return true;
  if (/lecture|seminar|tutorial|lab\s*session/i.test(title)) return true;
  return false;
}

/**
 * Returns a sorted copy of `tasks` using the given strategy.
 * @param {object[]} tasks
 * @param {"priority"|"due"|"alpha"|"list"|"date_added"|"est_time"} sortBy
 * @param {object} listMap - id → list object lookup
 */
export function sortTasks(tasks, sortBy, listMap) {
  const comparators = {
    priority:   (a, b) => compareTaskPriority(a, b),
    due:        (a, b) => compareTaskDue(a, b),
    alpha:      (a, b) => a.title.localeCompare(b.title),
    "alpha-desc": (a, b) => b.title.localeCompare(a.title),
    list:       (a, b) => sortByList(a, b, listMap),
    date_added: (a, b) => (b.id ?? 0) - (a.id ?? 0),
    est_time:   (a, b) => compareTaskEstimatedTime(a, b),
  };
  return [...tasks].sort(comparators[sortBy] ?? comparators.priority);
}

function sortByList(a, b, listMap) {
  const la = listMap?.[String(a.task_list)]?.name || "";
  const lb = listMap?.[String(b.task_list)]?.name || "";
  if (la !== lb) return la.localeCompare(lb);
  return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
}

/**
 * Resolves a list's display colour: list.color → localStorage → default palette.
 * @param {object|undefined} list
 */
export function getListColor(list) {
  if (list?.color) return list.color;
  const stored = readLocalStorageColor(list?.id);
  if (stored) return stored;
  return FOCUS_BLOCK_COLOURS_HEX[(list?.idx ?? 0) % FOCUS_BLOCK_COLOURS_HEX.length];
}

function readLocalStorageColor(id) {
  if (!id || typeof window === "undefined") return null;
  try {
    return localStorage.getItem("listColor:" + id);
  } catch (_) {
    return null;
  }
}
