/*
 * GroupWork task board card.
 */

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import TaskAssigneePopup from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import { getPriorityStyle } from "../utils/priorityUtils";
import { buildToggleAssignee, filterVisibleAssignees, getDueDateStr } from "../utils/taskUtils";
import ctxStyles from "../../Tasks/components/TaskCardContextMenu.module.css";
import styles from "./TaskBoardView.module.css";

function BoardContextMenu({ pos, task, onDelete, onClose, onEditStart }) {
  useEffect(() => {
    function handleMouseDown() { onClose(); }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  return createPortal(
    <div
      className={ctxStyles.ctxMenu}
      style={{ position: "fixed", top: pos.y, left: pos.x, zIndex: 10000 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button className={ctxStyles.ctxItem} onClick={() => { onClose(); onEditStart(); }}>
        <Pencil size={14} strokeWidth={2} /> Edit
      </button>
      <div className={ctxStyles.ctxDivider} />
      <button className={`${ctxStyles.ctxItem} ${ctxStyles.ctxItemDanger}`} onClick={() => { onClose(); onDelete(task.id); }}>
        <Trash2 size={14} strokeWidth={2} /> Delete
      </button>
    </div>,
    document.body
  );
}

function CardHeader({ task, priorityStyle, onUpdate }) {
  return (
    <div className={styles.cardHeader}>
      <select value={(task.priority || "medium").toLowerCase()} onChange={(event) => onUpdate(task.id, { priority: event.target.value })} className={styles.prioritySelect} style={{ backgroundColor: priorityStyle.backgroundColor, color: priorityStyle.color }}>
        <option value="urgent">URGENT</option>
        <option value="high">HIGH</option>
        <option value="medium">MEDIUM</option>
        <option value="low">LOW</option>
      </select>
    </div>
  );
}

function CardFooter({ task, assignees, onUpdate, triggerRef, togglePopup }) {
  return (
    <div className={styles.cardFooter}>
      <div className={styles.cardDate}>
        <DateTimePicker value={getDueDateStr(task.due_date)} onChange={(value) => onUpdate(task.id, { due_date: value ? new Date(value).toISOString() : null })} dateOnly triggerClassName={styles.dateLabelInteractive} hideIcon placeholder="No due date" />
      </div>
      <div ref={triggerRef} onClick={togglePopup} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <TaskAvatarStack assignees={assignees} size={18} />
        <span className={styles.addAssigneeBtn}>+</span>
      </div>
    </div>
  );
}

export default function TaskBoardCard({ task, members, onUpdate, onDelete, onDragStart }) {
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const triggerRef = useRef(null);
  const assignees = filterVisibleAssignees(task.assignees_info || [], members);
  const priorityStyle = getPriorityStyle(task.priority);

  const handleContextMenu = (e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); };

  const saveEdit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed });
    setEditing(false);
  };

  return (
    <>
      <div
        className={getCardClassName(task, showAssignPopup)}
        draggable
        onDragStart={(event) => onDragStart(event, task.id)}
        onContextMenu={handleContextMenu}
      >
        <CardHeader task={task} priorityStyle={priorityStyle} onUpdate={onUpdate} />
        {editing ? (
          <textarea
            autoFocus
            className={styles.cardTitleInput}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); } if (e.key === "Escape") setEditing(false); }}
            rows={2}
          />
        ) : (
          <div className={styles.cardTitle}>{task.title}</div>
        )}
        <CardFooter task={task} assignees={assignees} onUpdate={onUpdate} triggerRef={triggerRef} togglePopup={(event) => togglePopup(event, setShowAssignPopup)} />
        <TaskAssigneePopup isOpen={showAssignPopup} onClose={() => setShowAssignPopup(false)} members={members} assignees={assignees} onToggleAssignee={buildToggleAssignee(assignees, task.id, onUpdate)} triggerRef={triggerRef} />
      </div>
      {ctxMenu && (
        <BoardContextMenu
          pos={ctxMenu}
          task={task}
          onDelete={onDelete}
          onClose={() => setCtxMenu(null)}
          onEditStart={() => { setEditing(true); setEditTitle(task.title); }}
        />
      )}
    </>
  );
}

function getCardClassName(task, showAssignPopup) {
  return `${styles.boardCard} ${task.status === "done" || task.completed ? styles.boardCardDone : ""} ${showAssignPopup ? styles.boardCardActive : ""}`;
}

function togglePopup(event, setShowAssignPopup) {
  event.stopPropagation();
  setShowAssignPopup((value) => !value);
}
