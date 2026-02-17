import { createNewTask } from "../../utils/tasks/taskUtils";

function addItem(setItems, text, setText) {
  const trimmed = text.trim();
  if (!trimmed) return;
  setItems((prev) => [...prev, createNewTask(trimmed)]);
  setText("");
}

function toggleDone(setItems, setTaskMenuId, id) {
  setItems((prev) => prev.map((x) => toggleTaskDone(x, id)));
  setTaskMenuId(null);
}

function toggleUrgent(setItems, setTaskMenuId, id) {
  setItems((prev) => prev.map((x) => toggleTaskUrgent(x, id)));
  setTaskMenuId(null);
}

function deleteTask(setItems, setTaskMenuId, id) {
  setItems((prev) => prev.filter((x) => x.id !== id));
  setTaskMenuId(null);
}

function clearCompleted(setItems, setMenuOpen) {
  setItems((prev) => prev.filter((x) => !x.done));
  setMenuOpen(false);
}

function saveEdit(setItems, id, text, setEditingId, setEditText) {
  const trimmed = text.trim();
  if (!trimmed) { setEditingId(null); setEditText(""); return; }
  setItems((prev) => prev.map((x) => updateTaskTitle(x, id, trimmed)));
  setEditingId(null);
  setEditText("");
}

export function useTaskOperations(setItems, setTaskMenuId) {
  return {
    addItem: (text, setText) => addItem(setItems, text, setText),
    toggleDone: (id) => toggleDone(setItems, setTaskMenuId, id),
    toggleUrgent: (id) => toggleUrgent(setItems, setTaskMenuId, id),
    deleteTask: (id) => deleteTask(setItems, setTaskMenuId, id),
    clearCompleted: (setMenuOpen) => clearCompleted(setItems, setMenuOpen),
    saveEdit: (id, text, setEditingId, setEditText) => saveEdit(setItems, id, text, setEditingId, setEditText),
  };
}

function toggleTaskDone(task, id) {
  if (task.id !== id) return task;
  const nextDone = !task.done;
  return { ...task, done: nextDone, completedAt: nextDone ? Date.now() : null };
}

function toggleTaskUrgent(task, id) {
  if (task.id !== id) return task;
  return { ...task, urgent: !task.urgent };
}

function updateTaskTitle(task, id, newTitle) {
  if (task.id !== id) return task;
  return { ...task, title: newTitle };
}