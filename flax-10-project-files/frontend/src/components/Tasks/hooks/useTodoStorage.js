import { useState, useEffect } from "react";
import { normalizeItem } from "../utils/taskUtils";

const STORAGE_KEY = "flax_todo_items_v1";
const AUTO_CLEAR_MS = 2 * 60 * 60 * 1000;

export function useTodoStorage() {
  const [items, setItems] = useState(loadItems);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => {
    return setupAutoClear(items, setItems);
  }, [items]);

  return [items, setItems];
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).map(normalizeItem) : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { }
}

function setupAutoClear(items, setItems) {
  clearExpiredTasks(items, setItems);
  const nextExpiry = getNextExpiry(items);

  if (!nextExpiry) return;

  const id = scheduleNextClear(nextExpiry, setItems);
  return () => window.clearTimeout(id);
}

function clearExpiredTasks(items, setItems) {
  const now = Date.now();
  const hasExpired = items.some((t) => isExpired(t, now));

  if (hasExpired) {
    setItems((prev) => prev.filter((t) => !isExpired(t, now)));
  }
}

function isExpired(task, now) {
  return (
    task.done &&
    typeof task.completedAt === "number" &&
    now - task.completedAt >= AUTO_CLEAR_MS
  );
}

function getNextExpiry(items) {
  const now = Date.now();
  const expiryTimes = items
    .filter((t) => t.done && typeof t.completedAt === "number")
    .map((t) => t.completedAt + AUTO_CLEAR_MS)
    .filter((ts) => ts > now)
    .sort((a, b) => a - b);

  return expiryTimes[0];
}

function scheduleNextClear(nextExpiry, setItems) {
  const now = Date.now();
  return window.setTimeout(() => {
    const n = Date.now();
    setItems((prev) => prev.filter((t) => !isExpired(t, n)));
  }, Math.max(0, nextExpiry - now + 50));
}