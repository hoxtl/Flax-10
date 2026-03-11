import React, { useState, useEffect, useRef } from "react";
import { Check, Trash2, X } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import styles from "../GroupTasksTab.module.css";

const USER_COLORS = [
    "#7B6751", // Warm Brown
    "#C0714E", // Terracotta
    "#7BB38E", // Sage Green
    "#9A8CB0", // Muted Lavender
    "#7B9BAD", // Dusty Blue
    "#C4A46D", // Warm Gold
    "#8A7060", // Muted Bronze
    "#b08c4b"  // Flax Gold
];

const getUserColor = (userId) => {
    if (!userId) return USER_COLORS[0];
    const idStr = String(userId);
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
        hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export function TaskRow({ task, members, onToggle, onUpdate, onDelete }) {
    const [showAssignPopup, setShowAssignPopup] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const popupRef = useRef(null);
    const isDone = task.completed;

    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowAssignPopup(false);
            }
        }
        if (showAssignPopup) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAssignPopup]);

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
        if (p === "urgent") return { background: "#ffaebe", color: "#9e1f3d" };
        if (p === "high") return { background: "#fed7aa", color: "#c2410c" };
        if (p === "medium") return { background: "#fef08a", color: "#854d0e" };
        return { background: "#f1ede9", color: "#8f7969" };
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
                        "--cb-border": isDone ? taskColor : taskColorLight
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
                    onClick={() => setShowAssignPopup(!showAssignPopup)}
                    className={`${styles.assignClickTarget} ${showAssignPopup ? styles.assignClickTargetActive : ""}`}
                >
                    {assignees.length > 0 ? (
                        <div className={styles.avatarStack}>
                            {assignees.slice(0, 3).map((a, i) => (
                                <div
                                    key={a.id}
                                    title={a.name}
                                    className={styles.avatar}
                                    style={{
                                        background: getUserColor(a.id),
                                        marginLeft: i > 0 ? -8 : 0,
                                    }}
                                >
                                    {(a.name || "?").slice(0, 2).toUpperCase()}
                                </div>
                            ))}
                            {assignees.length > 3 && (
                                <span className={styles.avatarMore}>
                                    +{assignees.length - 3}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className={styles.unassigned}>Unassigned</span>
                    )}
                </div>

                {showAssignPopup && (
                    <div ref={popupRef} className={styles.assignPopup}>
                        <div className={styles.assignPopupHeader}>
                            <span className={styles.assignPopupTitle}>Assign Members</span>
                            <span className={styles.closePopupBtn} onClick={() => setShowAssignPopup(false)}>
                                <X size={12} />
                            </span>
                        </div>
                        {members.map(m => {
                            const isSelected = assignees.some(a => String(a.id) === String(m.user));
                            const userCol = getUserColor(m.user);
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => toggleAssignee(m.user)}
                                    className={`${styles.assignItem} ${isSelected ? styles.assignItemSelected : ""}`}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: userCol }} />
                                        <span>{m.user_name}</span>
                                    </div>
                                    {isSelected && <Check size={14} color={userCol} strokeWidth={3} />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className={styles.actionCell}>
                <button
                    onClick={() => onDelete(task.id)}
                    className={styles.deleteBtn}
                    title="Delete task"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
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
