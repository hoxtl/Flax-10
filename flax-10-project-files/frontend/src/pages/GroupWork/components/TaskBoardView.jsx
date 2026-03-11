import React, { useMemo } from "react";
import { Check, Trash2 } from "lucide-react";
import styles from "./TaskBoardView.module.css";

export default function TaskBoardView({ tasks, members, onToggle, onUpdate, onDelete }) {
    // Currently tasks only have a `completed` boolean rather than a full status enum.
    // For a Trello-style board, we'll map incomplete to "To Do" and complete to "Done".
    // Alternatively, if a 'status' field is added later, it will naturally slot in here.

    const columns = useMemo(() => {
        const todo = [];
        const done = [];

        tasks.forEach(t => {
            if (t.completed) {
                done.push(t);
            } else {
                todo.push(t);
            }
        });

        return [
            { id: "todo", title: "To Do", tasks: todo, color: "#8a7a6a", bg: "#f2ede5" },
            { id: "done", title: "Completed", tasks: done, color: "#6b8a6a", bg: "#e8f2e5" }
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

    return (
        <div className={styles.boardContainer}>
            {columns.map(col => (
                <div key={col.id} className={styles.column} style={{ background: col.bg }}>
                    <div className={styles.colHeader} style={{ color: col.color }}>
                        <div className={styles.colTitleWrapper}>
                            <h3 className={styles.colTitle}>{col.title}</h3>
                            <span className={styles.taskCount}>{col.tasks.length}</span>
                        </div>
                    </div>

                    <div className={styles.cardList}>
                        {col.tasks.map(t => {
                            const pColor = priorityColors[(t.priority || "medium").toLowerCase()] || priorityColors.medium;
                            const isDone = t.completed;
                            const dateStr = formatDate(t.due_date);

                            return (
                                <div key={t.id} className={`${styles.boardCard} ${isDone ? styles.boardCardDone : ""}`}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.cardPriority} style={{ background: pColor.bg, color: pColor.text }}>
                                            {t.priority || "Medium"}
                                        </span>
                                        <div className={styles.cardActions}>
                                            <button
                                                onClick={() => onToggle(t.id, !isDone)}
                                                className={`${styles.iconBtn} ${isDone ? styles.iconBtnDone : ""}`}
                                                title={isDone ? "Mark as To Do" : "Mark as Done"}
                                            >
                                                <Check size={14} strokeWidth={isDone ? 3 : 2} />
                                            </button>
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
                    </div>
                </div>
            ))}
        </div>
    );
}
