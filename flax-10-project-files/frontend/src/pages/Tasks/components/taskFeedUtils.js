/**
 * Shared utility functions and constants for the Tasks feed.
 * Handles task sorting, list colour resolution, and routine-task detection.
 */

import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";

/** Maps priority label to sort order (lower = higher priority). */
export const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

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
    priority:   (a, b) => sortByPriority(a, b),
    due:        (a, b) => sortByDue(a, b),
    alpha:      (a, b) => a.title.localeCompare(b.title),
    list:       (a, b) => sortByList(a, b, listMap),
    date_added: (a, b) => (b.id ?? 0) - (a.id ?? 0),
    est_time:   (a, b) => sortByEstTime(a, b),
  };
  return [...tasks].sort(comparators[sortBy] ?? comparators.priority);
}

function sortByPriority(a, b) {
  const pd = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
  return pd !== 0 ? pd : new Date(a.due_date || 0) - new Date(b.due_date || 0);
}

function sortByDue(a, b) {
  if (!a.due_date && !b.due_date) return 0;
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;
  return new Date(a.due_date) - new Date(b.due_date);
}

function sortByList(a, b, listMap) {
  const la = listMap?.[String(a.task_list)]?.name || "";
  const lb = listMap?.[String(b.task_list)]?.name || "";
  if (la !== lb) return la.localeCompare(lb);
  return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
}

function sortByEstTime(a, b) {
  const ae = a.estimated_blocks ?? 1;
  const be = b.estimated_blocks ?? 1;
  if (ae !== be) return ae - be;
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
