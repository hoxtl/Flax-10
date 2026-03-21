/*
 * GroupWork task board view.
 */

import { useMemo, useState } from "react";
import TaskBoardColumn from "./TaskBoardColumn";
import { buildBoardColumns } from "../utils/taskBoardUtils";
import styles from "./TaskBoardView.module.css";

function useBoardAdding(onAdd) {
  const [addingToCol, setAddingToCol] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  return { addingToCol, setAddingToCol, newCardTitle, setNewCardTitle, onSubmit: createSubmitHandler(newCardTitle, onAdd, setAddingToCol, setNewCardTitle), onKeyDown: createKeyDownHandler(setAddingToCol, setNewCardTitle, newCardTitle, onAdd) };
}

function createSubmitHandler(newCardTitle, onAdd, setAddingToCol, setNewCardTitle) {
  return (_event, columnId) => finishAddCard(newCardTitle, columnId, onAdd, setAddingToCol, setNewCardTitle);
}

function finishAddCard(newCardTitle, columnId, onAdd, setAddingToCol, setNewCardTitle) {
  if (newCardTitle.trim()) onAdd(newCardTitle.trim(), columnId);
  setAddingToCol(null);
  setNewCardTitle("");
}

function createKeyDownHandler(setAddingToCol, setNewCardTitle, newCardTitle, onAdd) {
  return (event, columnId) => handleKeyDown(event, columnId, setAddingToCol, setNewCardTitle, newCardTitle, onAdd);
}

function handleKeyDown(event, columnId, setAddingToCol, setNewCardTitle, newCardTitle, onAdd) {
  if (event.key === "Enter" && !event.shiftKey) return finishAddCard(newCardTitle, columnId, onAdd, setAddingToCol, setNewCardTitle);
  if (event.key !== "Escape") return;
  setAddingToCol(null);
  setNewCardTitle("");
}

export default function TaskBoardView({ tasks, members, onUpdate, onDelete, onAdd }) {
  const columns = useMemo(() => buildBoardColumns(tasks), [tasks]);
  const adding = useBoardAdding(onAdd);
  return (
    <div className={styles.boardContainer}>
      {columns.map((column) => <TaskBoardColumn key={column.id} column={column} members={members} onUpdate={onUpdate} onDelete={onDelete} adding={adding} />)}
    </div>
  );
}
