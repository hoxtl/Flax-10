import React, { useMemo } from "react";
import { Check, Trash2 } from "lucide-react";
import styles from "./TaskBoardView.module.css";

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
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) {
            onUpdate(Number(taskId), { status: colId });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("taskId", taskId);
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
                            const dateStr = formatDate(t.due_date);

                            return (
                                <div
                                    key={t.id}
                                    className={`${styles.boardCard} ${isDone ? styles.boardCardDone : ""}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, t.id)}
                                >
                                    <div className={styles.cardHeader}>
                                        <span className={styles.cardPriority} style={{ background: pColor.bg, color: pColor.text }}>
                                            {t.priority || "Medium"}
                                        </span>
                                        <div className={styles.cardActions}>
                                            <select
                                                value={t.status || (t.completed ? "done" : "todo")}
                                                onChange={(e) => onUpdate(t.id, { status: e.target.value })}
                                                className={styles.statusSelect}
                                                title="Change status"
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
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

                                    <div className={styles.cardFooter}>
                                        <div className={styles.cardDate}>
                                            {dateStr ? dateStr : "No due date"}
                                        </div>
                                        <div className={styles.avatarStack}>
                                            {(t.assignees_info || []).slice(0, 3).map((a, i) => (
                                                <div
                                                    key={a.id}
                                                    className={styles.avatarMini}
                                                    style={{ marginLeft: i > 0 ? -6 : 0 }}
                                                    title={a.name}
                                                >
                                                    {(a.name || "?").slice(0, 2).toUpperCase()}
                                                </div>
                                            ))}
                                            {(t.assignees_info || []).length > 3 && (
                                                <div className={styles.avatarMini} style={{ marginLeft: -6, fontSize: 8 }}>
                                                    +{(t.assignees_info.length - 3)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
