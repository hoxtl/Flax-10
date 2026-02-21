import { useState } from "react";
import styles from "./TaskCard.module.css";

const PRIORITY_COLOURS = {
    urgent: "var(--danger)",
    high: "#f59e0b",
    medium: "var(--primary)",
    low: "var(--muted)",
};

function DueDateBadge({ dueDate }) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const isOverdue = due < now;
    const isToday = due.toDateString() === now.toDateString();
    const label = isToday ? "Today" : due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return (
        <span className={styles.dueBadge} style={{ color: isOverdue ? "var(--danger)" : isToday ? "#f59e0b" : "var(--muted)" }}>
            📅 {isOverdue ? "Overdue" : label}
        </span>
    );
}

export default function TaskCard({ task, onToggle, onDelete }) {
    const [showMenu, setShowMenu] = useState(false);
    return (
        <div className={`${styles.card} ${task.completed ? styles.completed : ""}`}>
            <div className={styles.left}>
                <button className={styles.checkbox} onClick={onToggle}>
                    {task.completed ? "✓" : ""}
                </button>
                <div className={styles.content}>
                    <span className={styles.title}>{task.title}</span>
                    <div className={styles.meta}>
                        <span className={styles.priority} style={{ color: PRIORITY_COLOURS[task.priority] }}>
                            ● {task.priority}
                        </span>
                        {task.module_code && <span className={styles.module}>{task.module_code}</span>}
                        <DueDateBadge dueDate={task.due_date} />
                        {task.time_spent_minutes > 0 && (
                            <span className={styles.time}>⏱ {task.time_spent_minutes}m</span>
                        )}
                    </div>
                </div>
            </div>
            <button className={styles.menuBtn} onClick={() => setShowMenu(p => !p)}>⋯</button>
            {showMenu && (
                <div className={styles.menu}>
                    <button onClick={() => { onDelete(); setShowMenu(false); }}>Delete</button>
                </div>
            )}
        </div>
    );
}