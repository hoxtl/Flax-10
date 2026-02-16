import { createNewTask } from "../../utils/tasks/taskUtils";

export function useTaskOperations(setItems, setTaskMenuId) {
  const addItem = (text, setText) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newItem = createNewTask(trimmed);
    setItems((prev) => [...prev, newItem]);
    setText("");
  };

  const toggleDone = (id) => {
    setItems((prev) => prev.map((x) => toggleTaskDone(x, id)));
    setTaskMenuId(null);
  };

  const toggleUrgent = (id) => {
    setItems((prev) => prev.map((x) => toggleTaskUrgent(x, id)));
    setTaskMenuId(null);
  };

  const deleteTask = (id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    setTaskMenuId(null);
  };

  const clearCompleted = (setMenuOpen) => {
    setItems((prev) => prev.filter((x) => !x.done));
    setMenuOpen(false);
  };

  const saveEdit = (id, text, setEditingId, setEditText) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setEditingId(null);
      setEditText("");
      return;
    }
    setItems((prev) => prev.map((x) => updateTaskTitle(x, id, trimmed)));
    setEditingId(null);
    setEditText("");
  };

  return {
    addItem,
    toggleDone,
    toggleUrgent,
    deleteTask,
    clearCompleted,
    saveEdit,
  };
}

function toggleTaskDone(task, id) {
  if (task.id !== id) return task;

  const nextDone = !task.done;
  return {
    ...task,
    done: nextDone,
    completedAt: nextDone ? Date.now() : null,
  };
}

function toggleTaskUrgent(task, id) {
  if (task.id !== id) return task;
  return { ...task, urgent: !task.urgent };
}

function updateTaskTitle(task, id, newTitle) {
  if (task.id !== id) return task;
  return { ...task, title: newTitle };
}