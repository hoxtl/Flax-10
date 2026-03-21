/*
 * Task list helpers for merging colours and mutating list data.
 */

import { createTaskList, deleteTaskList, updateTaskList } from "../../../api/taskApi";

function getStoredColorForList(list) {
  if (!list.id || typeof window === "undefined") return null;
  try {
    return localStorage.getItem("listColor:" + list.id);
  } catch {
    return null;
  }
}

export function mergeListColors(data) {
  if (!data || !Array.isArray(data)) return [];
  return data.map((list) => {
    const stored = getStoredColorForList(list);
    return { ...list, color: list.color || stored || undefined };
  });
}

function setStoredListColor(listId, color) {
  try {
    localStorage.setItem("listColor:" + listId, color);
  } catch {
    return;
  }
}

export async function addListImpl(setLists, data) {
  const created = await createTaskList(data);
  if (!created?.id) {
    setLists((prev) => [...prev, created]);
    return created;
  }
  if (data.color) {
    setStoredListColor(created.id, data.color);
    setLists((prev) => prev.concat([{ ...created, color: data.color }]));
    return { ...created, color: data.color };
  }
  setLists((prev) => [...prev, created]);
  return created;
}

export async function renameListImpl(setLists, id, data) {
  const updated = await updateTaskList(id, typeof data === "string" ? { name: data } : data);
  setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
  return updated;
}

export async function removeListImpl(setLists, loadArchived, id) {
  await updateTaskList(id, { archived: true });
  setLists((prev) => prev.filter((l) => l.id !== id));
  loadArchived();
}

export async function restoreListImpl(load, loadArchived, id) {
  await updateTaskList(id, { archived: false });
  load();
  loadArchived();
}

export async function permanentlyDeleteListImpl(setArchivedLists, id) {
  await deleteTaskList(id);
  setArchivedLists((prev) => prev.filter((l) => l.id !== id));
}
