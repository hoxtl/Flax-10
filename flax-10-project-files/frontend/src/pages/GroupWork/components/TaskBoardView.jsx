import React, { useMemo, useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import TaskAssigneePopup from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import { getPriorityStyle } from "../utils/priorityUtils";
import { buildToggleAssignee, getDueDateStr } from "../utils/taskUtils";
import styles from "./TaskBoardView.module.css";


function CardHeader({ t, pColor, onUpdate, onDelete }) {
    return (
        <div className={styles.cardHeader}>
            <select
                value={(t.priority || "medium").toLowerCase()}
                onChange={(e) => onUpdate(t.id, { priority: e.target.value })}
                className={styles.prioritySelect}
                style={{ backgroundColor: pColor.backgroundColor, color: pColor.color }}
            >
                <option value="urgent">URGENT</option><option value="high">HIGH</option>
                <option value="medium">MEDIUM</option><option value="low">LOW</option>
            </select>
            <button onClick={() => onDelete(t.id)} className={styles.iconBtnDelete}><Trash2 size={14} /></button>
        </div>
    );
}

function CardFooter({ t, assignees, members, onUpdate, triggerRef, togglePopup }) {
    const dateStr = getDueDateStr(t.due_date);
    return (
        <div className={styles.cardFooter}>
            <div className={styles.cardDate}>
                <DateTimePicker value={dateStr} onChange={v => onUpdate(t.id, { due_date: v ? new Date(v).toISOString() : null })}
                    dateOnly triggerClassName={styles.dateLabelInteractive} hideIcon placeholder="No due date" />
            </div>
            <div ref={triggerRef} onClick={togglePopup} style={{ cursor: "pointer" }}>
                <TaskAvatarStack assignees={assignees} size={20} />
            </div>
        </div>
    );
}

function BoardCard({ t, isDone, pColor, onUpdate, onDelete, members, handleDragStart }) {
    const [showAssignPopup, setShowAssignPopup] = useState(false);
    const triggerRef = useRef(null);
    const togglePopup = (e) => { e.stopPropagation(); setShowAssignPopup(v => !v); };
    const toggleAssignee = buildToggleAssignee(t.assignees_info || [], t.id, onUpdate);

    return (
        <div className={`${styles.boardCard} ${isDone ? styles.boardCardDone : ""} ${showAssignPopup ? styles.boardCardActive : ""}`}
            draggable onDragStart={(e) => handleDragStart(e, t.id)} onContextMenu={e => { e.preventDefault(); setShowAssignPopup(true); }}>
            <CardHeader t={t} pColor={pColor} onUpdate={onUpdate} onDelete={onDelete} />
            <div className={styles.cardTitle}>{t.title}</div>
            <CardFooter t={t} assignees={t.assignees_info || []} members={members} onUpdate={onUpdate} triggerRef={triggerRef} togglePopup={togglePopup} />
            <TaskAssigneePopup isOpen={showAssignPopup} onClose={() => setShowAssignPopup(false)} members={members}
                assignees={t.assignees_info || []} onToggleAssignee={toggleAssignee} triggerRef={triggerRef} />
        </div>
    );
}

function buildBoardColumns(tasks) {
    const todo = [], inProgress = [], done = [];
    tasks.forEach(t => {
        const stat = t.status || (t.completed ? "done" : "todo");
        if (stat === "done") done.push(t);
        else if (stat === "in_progress") inProgress.push(t);
        else todo.push(t);
    });
    return [
        { id: "todo", title: "To Do", tasks: todo, color: "#8a7a6a", bg: "#f2ede5", dotCol: "#c0a080" },
        { id: "in_progress", title: "In Progress", tasks: inProgress, color: "#547da3", bg: "#e6eff5", dotCol: "#80b2d6" },
        { id: "done", title: "Done", tasks: done, color: "#6b8a6a", bg: "#e8f2e5", dotCol: "#8bc28a" }
    ];
}

export default function TaskBoardView({ tasks, members, onToggle, onUpdate, onDelete, onAdd }) {
    const [addingToCol, setAddingToCol] = React.useState(null);
    const [newCardTitle, setNewCardTitle] = React.useState("");
    const columns = useMemo(() => buildBoardColumns(tasks), [tasks]);


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
                            const pColor = getPriorityStyle(t.priority);
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
