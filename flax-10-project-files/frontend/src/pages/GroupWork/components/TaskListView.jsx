import React, { useState, useRef } from "react";
import { Check, Trash2 } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import TaskAssigneePopup from "./TaskAssigneePopup";
import { getUserColor } from "../utils/priorityUtils";
import TaskAvatarStack from "./TaskAvatarStack";
import { getPriorityStyle } from "../utils/priorityUtils";
import { buildToggleAssignee, getDueDateStr } from "../utils/taskUtils";
import styles from "../GroupTasksTab.module.css";

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

function AssignCell({ task, members, onUpdate }) {
    const [showPopup, setShowPopup] = useState(false);
    const triggerRef = useRef(null);
    const assignees = task.assignees_info || [];
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

export function TaskRow({ task, members, onToggle, onUpdate, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const assignees = task.assignees_info || [];
    const color = assignees.length > 0 ? getUserColor(assignees[0].id) : "#8d7355";

    const save = () => { if (editedTitle.trim() && editedTitle !== task.title) onUpdate(task.id, { title: editedTitle.trim() }); setIsEditing(false); };
    const cancel = () => { setEditedTitle(task.title); setIsEditing(false); };

    return (
        <div className={styles.taskRow} style={{ opacity: task.completed ? 0.6 : 1 }}>
            <div className={styles.taskMainCell}>
                <TaskCheckbox isDone={task.completed} color={color} onToggle={() => onToggle(task.id, !task.completed)} />
                <div className={styles.titleArea}>
                    <TaskTitleField task={task} isEditing={isEditing} editedTitle={editedTitle} setEditedTitle={setEditedTitle} onSave={save} onCancel={cancel} onStartEdit={() => { setEditedTitle(task.title); setIsEditing(true); }} />
                </div>
            </div>
            <PrioritySelect priority={task.priority} onUpdate={onUpdate} taskId={task.id} />
            <div className={styles.dateCell}>
                <DateTimePicker value={getDueDateStr(task.due_date)} onChange={val => onUpdate(task.id, { due_date: val ? new Date(val).toISOString() : null })} placeholder="Set Date" dateOnly triggerClassName={styles.dateLabel} hideIcon />
            </div>
            <AssignCell task={task} members={members} onUpdate={onUpdate} />
            <div className={styles.actionCell}>
                <button onClick={() => onDelete(task.id)} className={styles.deleteBtn} title="Delete task"><Trash2 size={16} /></button>
            </div>
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
