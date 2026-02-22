import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    const label = isToday
        ? "Today"
        : due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return (
        <span
            className={styles.dueBadge}
            style={{ color: isOverdue ? "var(--danger)" : isToday ? "#f59e0b" : "var(--muted)" }}
        >
            📅 {isOverdue ? "Overdue" : label}
        </span>
    );
}

function FlaxProgress({ completed, estimated }) {
    if (!estimated || estimated <= 0) return null;
    const pct = Math.min((completed / estimated) * 100, 100);
    const isOver = completed > estimated;
    return (
        <div className={styles.flaxWrap} title={`${completed}/${estimated} Flax blocks`}>
            <div className={styles.flaxBar}>
                <div
                    className={styles.flaxFill}
                    style={{
                        width: `${pct}%`,
                        background: isOver ? "var(--danger)" : "var(--primary)",
                    }}
                />
            </div>
            <span className={styles.flaxLabel}>
                {isOver ? "⚠️" : "🟫"} {completed}/{estimated} blocks
            </span>
        </div>
    );
}

function EditTaskModal({ task, onSave, onClose }) {
    const [form, setForm] = useState({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        due_date: task.due_date ? task.due_date.slice(0, 16) : "",
        estimated_blocks: task.estimated_blocks || "",
    });
    const set = (field, val) => setForm(p => ({ ...p, [field]: val }));
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave({
            ...form,
            due_date: form.due_date || null,
            estimated_blocks: form.estimated_blocks ? Number(form.estimated_blocks) : null,
        });
        setSaving(false);
        onClose();
    };

    return (
        <div className={styles.overlay} onMouseDown={onClose}>
            <div className={styles.editModal} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.editHeader}>
                    <h3>Edit Task</h3>
                    <button onClick={onClose}>×</button>
                </div>
                <div className={styles.editBody}>
                    <input
                        className={styles.editInput}
                        value={form.title}
                        onChange={e => set("title", e.target.value)}
                        placeholder="Task title"
                    />
                    <textarea
                        className={styles.editDesc}
                        value={form.description}
                        onChange={e => set("description", e.target.value)}
                        placeholder="Description"
                        rows={2}
                    />
                    <div className={styles.editRow}>
                        <div className={styles.editField}>
                            <label>Priority</label>
                            <select value={form.priority} onChange={e => set("priority", e.target.value)}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div className={styles.editField}>
                            <label>Due date</label>
                            <input
                                type="datetime-local"
                                value={form.due_date}
                                onChange={e => set("due_date", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={styles.editField}>
                        <label>🟫 Flax blocks (estimated)</label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            placeholder="e.g. 3 (each block = 25 min)"
                            value={form.estimated_blocks}
                            onChange={e => set("estimated_blocks", e.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.editFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TaskCard({ task, onToggle, onDelete, onEdit }) {
    const [showMenu, setShowMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const nav = useNavigate();

    const completedBlocks = task.completed_blocks || 0;
    const estimatedBlocks = task.estimated_blocks || 0;

    return (
        <>
            <div className={`${styles.card} ${task.completed ? styles.completed : ""}`}>
                <div className={styles.left}>
                    <button className={styles.checkbox} onClick={onToggle}>
                        {task.completed ? "✓" : ""}
                    </button>
                    <div className={styles.content}>
                        <div className={styles.titleRow}>
                            <span className={styles.title}>{task.title}</span>
                            {!task.completed && (
                                <button
                                    className={styles.studyNowBtn}
                                    title="Study Now"
                                    onClick={() => nav(`/timer?taskId=${task.id}`)}
                                >
                                    ▶
                                </button>
                            )}
                        </div>
                        <div className={styles.meta}>
                            <span
                                className={styles.priority}
                                style={{ color: PRIORITY_COLOURS[task.priority] }}
                            >
                                ● {task.priority}
                            </span>
                            {task.module_code && (
                                <span className={styles.module}>{task.module_code}</span>
                            )}
                            <DueDateBadge dueDate={task.due_date} />
                            {task.time_spent_minutes > 0 && (
                                <span className={styles.time}>⏱ {task.time_spent_minutes}m</span>
                            )}
                        </div>
                        <FlaxProgress
                            completed={completedBlocks}
                            estimated={estimatedBlocks}
                        />
                    </div>
                </div>
                <button className={styles.menuBtn} onClick={() => setShowMenu(p => !p)}>
                    ⋯
                </button>
                {showMenu && (
                    <div className={styles.menu}>
                        <button onClick={() => { setShowEditModal(true); setShowMenu(false); }}>
                            Edit
                        </button>
                        <button
                            className={styles.deleteBtn}
                            onClick={() => { onDelete(); setShowMenu(false); }}
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
            {showEditModal && (
                <EditTaskModal
                    task={task}
                    onSave={data => onEdit(data)}
                    onClose={() => setShowEditModal(false)}
                />
            )}
        </>
    );
}