import React, { useState, useRef } from "react";
import { Check, Trash2 } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import TaskAssigneePopup from "./TaskAssigneePopup";
import { getUserColor } from "../utils/priorityUtils";
import TaskAvatarStack from "./TaskAvatarStack";
import { getPriorityStyle } from "../utils/priorityUtils";
import { buildToggleAssignee, getDueDateStr } from "../utils/taskUtils";
import styles from "./TaskListView.module.css";

function TaskCheckbox({ isDone, color, onToggle }) {
    return (
        <button onClick={onToggle} className={`${styles.checkbox} ${isDone ? styles.checkboxDone : ""}`}
            style={{ "--cb-bg": color, "--cb-border": isDone ? color : "var(--border)" }}>
            {isDone && <Check size={14} strokeWidth={3} />}
        </button>
    );
}

function TaskTitleField({ task, isEditing, editedTitle, setEditedTitle, onSave, onCancel, onStartEdit }) {
    if (!isEditing) {
        return <span onClick={onStartEdit} className={`${styles.titleSpan} ${task.completed ? styles.titleDone : ""}`} title="Click to edit">{task.title}</span>;
    }
    const color = getUserColor((task.assignees_info || [])[0]?.id);
    return (
        <textarea autoFocus value={editedTitle} className={styles.titleEditArea} style={{ "--cb-bg": color }}
            onChange={e => { setEditedTitle(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            ref={el => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
            onBlur={onSave}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(); } if (e.key === "Escape") onCancel(); }}
            rows={1}
        />
    );
}

function filterAssignees(assignees, members) {
  if (!Array.isArray(assignees) || !Array.isArray(members)) return assignees || [];
  const memberIds = new Set(members.map(m => String(m.user)));
  return assignees.filter(a => memberIds.has(String(a.id)));
}

function AssignCell({ task, members, onUpdate }) {
    const [showPopup, setShowPopup] = useState(false);
    const triggerRef = useRef(null);
  const assignees = filterAssignees(task.assignees_info || [], members);
    const toggleAssignee = buildToggleAssignee(assignees, task.id, onUpdate);
    return (
        <div className={styles.assignCell}>
            <div ref={triggerRef} onClick={() => setShowPopup(v => !v)} className={`${styles.assignClickTarget} ${showPopup ? styles.assignClickTargetActive : ""}`}>
                {assignees.length > 0 ? <TaskAvatarStack assignees={assignees} size={24} /> : <span className={styles.unassigned}>Unassigned</span>}
            </div>
            <TaskAssigneePopup isOpen={showPopup} onClose={() => setShowPopup(false)} members={members} assignees={assignees} onToggleAssignee={toggleAssignee} triggerRef={triggerRef} />
        </div>
    );
}

function PrioritySelect({ priority, onUpdate, taskId }) {
    const pStyle = getPriorityStyle(priority);
    return (
        <select value={priority || "medium"} className={styles.prioritySelect}
            style={{ backgroundColor: pStyle.backgroundColor, color: pStyle.color }}
            onChange={e => onUpdate(taskId, { priority: e.target.value })}>
            <option value="low">Low</option><option value="medium">Medium</option>
            <option value="high">High</option><option value="urgent">Urgent</option>
        </select>
    );
}

function DateCell({ taskId, due_date, onUpdate }) {
    const onChange = val => onUpdate(taskId, { due_date: val ? new Date(val).toISOString() : null });
    return (
        <div className={styles.dateCell}>
            <DateTimePicker value={getDueDateStr(due_date)} onChange={onChange} placeholder="Set Date" dateOnly triggerClassName={styles.dateLabel} hideIcon />
        </div>
    );
}

function ActionCell({ taskId, onDelete }) {
    return (
        <div className={styles.actionCell}>
            <button onClick={() => onDelete(taskId)} className={styles.deleteBtn} title="Delete task"><Trash2 size={16} /></button>
        </div>
    );
}

function useTaskRowEdit(task, onUpdate) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const save = () => { if (editedTitle.trim() && editedTitle !== task.title) onUpdate(task.id, { title: editedTitle.trim() }); setIsEditing(false); };
    const cancel = () => { setEditedTitle(task.title); setIsEditing(false); };
    const start = () => { setEditedTitle(task.title); setIsEditing(true); };
    return { isEditing, editedTitle, setEditedTitle, save, cancel, start };
}

export function TaskRow({ task, members, onToggle, onUpdate, onDelete }) {
    const edit = useTaskRowEdit(task, onUpdate);
  const visibleAssignees = filterAssignees(task.assignees_info || [], members);
  const m = visibleAssignees[0];
    const color = m ? getUserColor(m.id) : "#8d7355";

    return (
        <div className={styles.taskRow} style={{ opacity: task.completed ? 0.6 : 1 }}>
            <div className={styles.taskMainCell}>
                <TaskCheckbox isDone={task.completed} color={color} onToggle={() => onToggle(task.id, !task.completed)} />
                <div className={styles.titleArea}>
                    <TaskTitleField task={task} {...edit} onStartEdit={edit.start} onSave={edit.save} onCancel={edit.cancel} />
                </div>
            </div>
            <PrioritySelect priority={task.priority} onUpdate={onUpdate} taskId={task.id} />
            <DateCell taskId={task.id} due_date={task.due_date} onUpdate={onUpdate} />
            <AssignCell task={task} members={members} onUpdate={onUpdate} />
            <ActionCell taskId={task.id} onDelete={onDelete} />
        </div>
    );
}

export default function TaskListView({ tasks, members, onToggle, onUpdate, onDelete }) {
    if (tasks.length === 0) return <div className={styles.emptyState}>No tasks yet. Create one to get started!</div>;
    return (
        <div className={styles.taskList}>
            {tasks.map(task => <TaskRow key={task.id} task={task} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />)}
        </div>
    );
}
