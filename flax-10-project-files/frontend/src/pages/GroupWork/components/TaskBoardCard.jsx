/*
 * GroupWork task board card.
 */

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import TaskAssigneePopup from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import { getPriorityStyle } from "../utils/priorityUtils";
import { buildToggleAssignee, filterVisibleAssignees, getDueDateStr } from "../utils/taskUtils";
import styles from "./TaskBoardView.module.css";

function CardHeader({ task, priorityStyle, onUpdate, onDelete }) {
  return (
    <div className={styles.cardHeader}>
      <select value={(task.priority || "medium").toLowerCase()} onChange={(event) => onUpdate(task.id, { priority: event.target.value })} className={styles.prioritySelect} style={{ backgroundColor: priorityStyle.backgroundColor, color: priorityStyle.color }}>
        <option value="urgent">URGENT</option>
        <option value="high">HIGH</option>
        <option value="medium">MEDIUM</option>
        <option value="low">LOW</option>
      </select>
      <button onClick={() => onDelete(task.id)} className={styles.iconBtnDelete}><Trash2 size={14} /></button>
    </div>
  );
}

function CardFooter({ task, assignees, onUpdate, triggerRef, togglePopup }) {
  return (
    <div className={styles.cardFooter}>
      <div className={styles.cardDate}>
        <DateTimePicker value={getDueDateStr(task.due_date)} onChange={(value) => onUpdate(task.id, { due_date: value ? new Date(value).toISOString() : null })} dateOnly triggerClassName={styles.dateLabelInteractive} hideIcon placeholder="No due date" />
      </div>
      <div ref={triggerRef} onClick={togglePopup} style={{ cursor: "pointer" }}><TaskAvatarStack assignees={assignees} size={20} /></div>
    </div>
  );
}

export default function TaskBoardCard({ task, members, onUpdate, onDelete, onDragStart }) {
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const triggerRef = useRef(null);
  const assignees = filterVisibleAssignees(task.assignees_info || [], members);
  const priorityStyle = getPriorityStyle(task.priority);
  return (
    <div className={getCardClassName(task, showAssignPopup)} draggable onDragStart={(event) => onDragStart(event, task.id)} onContextMenu={(event) => openPopupFromContext(event, setShowAssignPopup)}>
      <CardHeader task={task} priorityStyle={priorityStyle} onUpdate={onUpdate} onDelete={onDelete} />
      <div className={styles.cardTitle}>{task.title}</div>
      <CardFooter task={task} assignees={assignees} onUpdate={onUpdate} triggerRef={triggerRef} togglePopup={(event) => togglePopup(event, setShowAssignPopup)} />
      <TaskAssigneePopup isOpen={showAssignPopup} onClose={() => setShowAssignPopup(false)} members={members} assignees={assignees} onToggleAssignee={buildToggleAssignee(assignees, task.id, onUpdate)} triggerRef={triggerRef} />
    </div>
  );
}

function getCardClassName(task, showAssignPopup) {
  return `${styles.boardCard} ${task.status === "done" || task.completed ? styles.boardCardDone : ""} ${showAssignPopup ? styles.boardCardActive : ""}`;
}

function openPopupFromContext(event, setShowAssignPopup) {
  event.preventDefault();
  setShowAssignPopup(true);
}

function togglePopup(event, setShowAssignPopup) {
  event.stopPropagation();
  setShowAssignPopup((value) => !value);
}
