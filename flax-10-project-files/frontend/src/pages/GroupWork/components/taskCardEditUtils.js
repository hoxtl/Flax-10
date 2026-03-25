/*
 * Shared editable task title helpers for GroupWork cards.
 */

import { useState } from "react";

export function useTaskTitleEdit(task, onUpdate) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const saveEdit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed });
    setEditing(false);
  };

  return { editing, setEditing, editTitle, setEditTitle, saveEdit };
}

export function handleTaskTitleKeyDown(event, saveEdit, setEditing) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    saveEdit();
  }
  if (event.key === "Escape") setEditing(false);
}
