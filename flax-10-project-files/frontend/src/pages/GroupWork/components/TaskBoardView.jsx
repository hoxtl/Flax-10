import React, { useMemo, useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import TaskAssigneePopup, { getUserColor } from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import styles from "./TaskBoardView.module.css";


function BoardCard({ t, isDone, pColor, onUpdate, onDelete, members, handleDragStart }) {
    const [showAssignPopup, setShowAssignPopup] = useState(false);
    const triggerRef = useRef(null);

    const handleTogglePopup = (e) => {
        e.stopPropagation();
        setShowAssignPopup(v => !v);
    };

    const toggleAssignee = (userId) => {
        const assignees = t.assignees_info || [];
        let currentIds = assignees.map(a => a.id);
        if (currentIds.includes(userId)) {
            currentIds = currentIds.filter(id => id !== userId);
        } else {
            currentIds.push(userId);
        }
        onUpdate(t.id, { assigned_to: currentIds });
    };

    const handleContextMenu = (e) => {
        e.preventDefault(); // Prevent standard browser right-click menu
        setShowAssignPopup(true);
    };

    let fullDateStr = "";
    if (t.due_date) {
        const d = new Date(t.due_date);
        fullDateStr = d.toISOString().slice(0, 10);
    }

    const assignees = t.assignees_info || [];

    return (
        <div
            className={`${styles.boardCard} ${isDone ? styles.boardCardDone : ""} ${showAssignPopup ? styles.boardCardActive : ""}`}
            draggable
            onDragStart={(e) => handleDragStart(e, t.id)}
            onContextMenu={handleContextMenu}
        >
            <div className={styles.cardHeader}>
                <select
                    value={(t.priority || "medium").toLowerCase()}
                    onChange={(e) => onUpdate(t.id, { priority: e.target.value })}
                    className={styles.prioritySelect}
                    style={{ background: pColor.bg, color: pColor.text }}
                    title="Change priority"
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="urgent">URGENT</option>
                    <option value="high">HIGH</option>
                    <option value="medium">MEDIUM</option>
                    <option value="low">LOW</option>
                </select>
                <div className={styles.cardActions}>
                    <button
                        onClick={() => onDelete(t.id)}
                        className={styles.iconBtnDelete}
                        title="Delete task"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className={styles.cardTitle}>{t.title}</div>

            <div className={styles.cardFooter} style={{ position: 'relative' }}>
                <div className={styles.cardDate}>
                    <DateTimePicker
                        value={fullDateStr}
                        onChange={(val) => onUpdate(t.id, { due_date: val ? new Date(val).toISOString() : null })}
                        placeholder="No due date"
                        dateOnly={true}
                        triggerClassName={styles.dateLabelInteractive}
                        hideIcon={true}
                    />
                </div>
                <div
                    ref={triggerRef}
                    onClick={handleTogglePopup}
                    style={{ cursor: "pointer" }}
                >
                    <TaskAvatarStack assignees={assignees} size={20} />
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
        </div>
    );
}

export default function TaskBoardView({ tasks, members, onToggle, onUpdate, onDelete, onAdd }) {
    const [addingToCol, setAddingToCol] = React.useState(null);
    const [newCardTitle, setNewCardTitle] = React.useState("");

    const columns = useMemo(() => {
        const todo = [];
        const inProgress = [];
        const done = [];

        tasks.forEach(t => {
            const stat = t.status || (t.completed ? "done" : "todo");
            if (stat === "done") {
                done.push(t);
            } else if (stat === "in_progress") {
                inProgress.push(t);
            } else {
                todo.push(t);
            }
        });

        return [
            { id: "todo", title: "To Do", tasks: todo, color: "#8a7a6a", bg: "#f2ede5", dotCol: "#c0a080" },
            { id: "in_progress", title: "In Progress", tasks: inProgress, color: "#547da3", bg: "#e6eff5", dotCol: "#80b2d6" },
            { id: "done", title: "Done", tasks: done, color: "#6b8a6a", bg: "#e8f2e5", dotCol: "#8bc28a" }
        ];
    }, [tasks]);

    const priorityColors = {
        urgent: { bg: "#f9a8c9", text: "#9b2257" },
        high: { bg: "#fcd5a8", text: "#9b5a22" },
        medium: { bg: "#f5e6a3", text: "#7a6a1a" },
        low: { bg: "#b8e8c8", text: "#1a6a3a" },
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleAddSubmit = (e, colId) => {
        e.preventDefault();
        if (newCardTitle.trim()) {
            onAdd(newCardTitle.trim(), colId);
        }
        setAddingToCol(null);
        setNewCardTitle("");
    };

    const handleKeyDown = (e, colId) => {
        if (e.key === "Enter" && !e.shiftKey) {
            handleAddSubmit(e, colId);
        }
        if (e.key === "Escape") {
            setAddingToCol(null);
            setNewCardTitle("");
        }
    };

    const handleDrop = (e, colId) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
            onUpdate(Number(taskId), { status: colId });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("text/plain", String(taskId));
    };

    return (
        <div className={styles.boardContainer}>
            {columns.map(col => (
                <div
                    key={col.id}
                    className={styles.column}
                    style={{ background: col.bg }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    <div className={styles.colHeader} style={{ color: col.color }}>
                        <div className={styles.colTitleWrapper}>
                            <div className={styles.colDot} style={{ background: col.dotCol }} />
                            <h3 className={styles.colTitle}>{col.title}</h3>
                        </div>
                        <span className={styles.taskCount}>{col.tasks.length}</span>
                    </div>

                    <div className={styles.cardList}>
                        {col.tasks.map(t => {
                            const pColor = priorityColors[(t.priority || "medium").toLowerCase()] || priorityColors.medium;
                            const isDone = (t.status === "done" || t.completed);
                            return (
                                <BoardCard
                                    key={t.id}
                                    t={t}
                                    isDone={isDone}
                                    pColor={pColor}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                    members={members}
                                    handleDragStart={handleDragStart}
                                />
                            );
                        })}
                        {col.tasks.length === 0 && (
                            <div className={styles.emptyCol}>No tasks</div>
                        )}
                        {addingToCol === col.id ? (
                            <div className={styles.addCardInputWrapper}>
                                <textarea
                                    autoFocus
                                    value={newCardTitle}
                                    onChange={(e) => setNewCardTitle(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, col.id)}
                                    onBlur={(e) => handleAddSubmit(e, col.id)}
                                    className={styles.addCardInput}
                                    placeholder="Enter title..."
                                    rows={2}
                                />
                            </div>
                        ) : (
                            <button
                                className={styles.addCardBtn}
                                onClick={() => setAddingToCol(col.id)}
                            >
                                + Add card
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
