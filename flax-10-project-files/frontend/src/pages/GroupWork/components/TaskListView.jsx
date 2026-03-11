import React, { useState, useEffect, useRef } from "react";
import { Check, Trash2, X } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import TaskAssigneePopup, { getUserColor } from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import styles from "../GroupTasksTab.module.css";



export function TaskRow({ task, members, onToggle, onUpdate, onDelete }) {
    const [showAssignPopup, setShowAssignPopup] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const triggerRef = useRef(null);
    const isDone = task.completed;

    // Unified TaskAssigneePopup handles click outside and positioning logic

    const assignees = task.assignees_info || [];
    const taskColor = assignees.length > 0 ? getUserColor(assignees[0].id) : "#8d7355";
    const taskColorLight = taskColor + "33";

    const toggleAssignee = (userId) => {
        let currentIds = assignees.map(a => a.id);
        if (currentIds.includes(userId)) {
            currentIds = currentIds.filter(id => id !== userId);
        } else {
            currentIds.push(userId);
        }
        onUpdate(task.id, { assigned_to: currentIds });
    };

    const handlePriorityChange = (e) => {
        onUpdate(task.id, { priority: e.target.value });
    };

    const handleTitleSave = () => {
        if (editedTitle.trim() && editedTitle !== task.title) {
            onUpdate(task.id, { title: editedTitle.trim() });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleTitleSave();
        }
        if (e.key === "Escape") {
            setEditedTitle(task.title);
            setIsEditing(false);
        }
    };

    const startEditing = () => {
        setEditedTitle(task.title);
        setIsEditing(true);
    };

    let fullDateStr = "";
    if (task.due_date) {
        const d = new Date(task.due_date);
        fullDateStr = d.toISOString().slice(0, 10);
    }

    const getPriorityStyle = (priority) => {
        const p = (priority || "").toLowerCase();
        if (p === "urgent") return { background: "#f9a8c9", color: "#9b2257" };
        if (p === "high") return { background: "#fcd5a8", color: "#9b5a22" };
        if (p === "medium") return { background: "#f5e6a3", color: "#7a6a1a" };
        return { background: "#b8e8c8", color: "#1a6a3a" };
    };

    const pStyle = getPriorityStyle(task.priority);

    return (
        <div className={styles.taskRow} style={{ opacity: isDone ? 0.6 : 1 }}>
            <div className={styles.taskMainCell}>
                <button
                    onClick={() => onToggle(task.id, !isDone)}
                    className={`${styles.checkbox} ${isDone ? styles.checkboxDone : ""}`}
                    style={{
                        "--cb-bg": taskColor,
                        "--cb-border": isDone ? taskColor : "var(--border)"
                    }}
                >
                    {isDone && <Check size={14} strokeWidth={3} />}
                </button>
                <div className={styles.titleArea}>
                    {isEditing ? (
                        <textarea
                            autoFocus
                            value={editedTitle}
                            onChange={(e) => {
                                setEditedTitle(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onBlur={handleTitleSave}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            ref={(el) => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }
                            }}
                            className={styles.titleEditArea}
                            style={{ "--cb-bg": taskColor }}
                        />
                    ) : (
                        <span
                            onClick={startEditing}
                            className={`${styles.titleSpan} ${isDone ? styles.titleDone : ""}`}
                            title="Click to edit"
                        >
                            {task.title}
                        </span>
                    )}
                </div>
            </div>

            <div>
                <select
                    value={task.priority || "medium"}
                    onChange={handlePriorityChange}
                    className={styles.prioritySelect}
                    style={pStyle}
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
            </div>

            <div className={styles.dateCell}>
                <DateTimePicker
                    value={fullDateStr}
                    onChange={(val) => onUpdate(task.id, { due_date: val ? new Date(val).toISOString() : null })}
                    placeholder="Set Date"
                    dateOnly={true}
                    triggerClassName={styles.dateLabel}
                    hideIcon={true}
                />
            </div>

            <div className={styles.assignCell}>
                <div
                    ref={triggerRef}
                    onClick={() => setShowAssignPopup(!showAssignPopup)}
                    className={`${styles.assignClickTarget} ${showAssignPopup ? styles.assignClickTargetActive : ""}`}
                >
                    {assignees.length > 0 ? (
                        <TaskAvatarStack assignees={assignees} size={24} />
                    ) : (
                        <span className={styles.unassigned}>Unassigned</span>
                    )}
                </div>

                <TaskAssigneePopup
                    isOpen={showAssignPopup}
                    onClose={() => setShowAssignPopup(false)}
                    members={members}
                    assignees={assignees}
                    onToggleAssignee={toggleAssignee}
                    triggerRef={triggerRef}
                />
            </div>

            <div className={styles.actionCell}>
                <button
                    onClick={() => onDelete(task.id)}
                    className={styles.deleteBtn}
                    style={{ color: "var(--text-secondary)" }}
                    title="Delete task"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div >
    );
}

export default function TaskListView({ tasks, members, onToggle, onUpdate, onDelete }) {
    if (tasks.length === 0) {
        return (
            <div className={styles.emptyState}>
                No tasks yet. Create one to get started!
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            {tasks.map((task) => (
                <TaskRow
                    key={task.id}
                    task={task}
                    members={members}
                    onToggle={onToggle}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
