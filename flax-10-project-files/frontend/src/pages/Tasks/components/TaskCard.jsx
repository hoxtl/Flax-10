import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TaskCard.module.css";

const PRIORITY_COLOURS = {
    urgent: "#ef4444",
    high:   "#f59e0b",
    medium: "#8b7355",
    low:    "#94a3b8",
};

const PRIORITY_LABELS = {
    urgent: "Urgent",
    high:   "High",
    medium: "Medium",
    low:    "Low",
};

function formatDueDate(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((dueDay - today) / 86400000);

    if (diffDays < 0)  return { label: "Overdue",    status: "overdue" };
    if (diffDays === 0) return { label: "Today",     status: "today" };
    if (diffDays === 1) return { label: "Tomorrow",  status: "soon" };
    if (diffDays <= 3)  return { label: `${diffDays} days`, status: "soon" };
    return {
        label: due.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        status: "normal",
    };
}

function EditTaskModal({ task, onSave, onClose }) {
    const [form, setForm] = useState({
        title:       task.title,
        description: task.description || "",
        priority:    task.priority,
        due_date:    task.due_date ? task.due_date.slice(0, 16) : "",
    });
    const [saving, setSaving] = useState(false);
    const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

    const handleSave = async () => {
        setSaving(true);
        await onSave({ ...form, due_date: form.due_date || null });
        setSaving(false);
        onClose();
    };

    return (
        <div className={styles.modalBackdrop} onMouseDown={onClose}>
            <div className={styles.editModal} onMouseDown={e => e.stopPropagation()}>
                <div className={styles.editHeader}>
                    <h3 className={styles.editTitle}>Edit Task</h3>
                    <button className={styles.editClose} onClick={onClose}>✕</button>
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
                        placeholder="Description (optional)"
                        rows={2}
                    />
                    <div className={styles.editGrid}>
                        <div className={styles.editField}>
                            <label className={styles.editLabel}>Priority</label>
                            <select
                                className={styles.editSelect}
                                value={form.priority}
                                onChange={e => set("priority", e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div className={styles.editField}>
                            <label className={styles.editLabel}>Due date</label>
                            <input
                                className={styles.editInput}
                                type="datetime-local"
                                value={form.due_date}
                                onChange={e => set("due_date", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.editFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TaskCard({ task, onToggle, onDelete, onEdit, listName, listColor }) {
    const [showMenu, setShowMenu] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const nav = useNavigate();

    const due   = formatDueDate(task.due_date);
    const color = PRIORITY_COLOURS[task.priority] || "#94a3b8";

    return (
        <>
            <div
                className={`${styles.card} ${task.completed ? styles.cardDone : ""}`}
                style={{ "--accent": color }}
            >
                {/* Left accent stripe */}
                <div className={styles.stripe} />

                {/* Checkbox */}
                <button
                    className={`${styles.check} ${task.completed ? styles.checkDone : ""}`}
                    onClick={onToggle}
                    title={task.completed ? "Mark incomplete" : "Mark complete"}
                >
                    {task.completed && <span className={styles.checkMark}>✓</span>}
                </button>

                {/* Main content */}
                <div className={styles.content}>
                    <div className={styles.titleRow}>
                        <span className={`${styles.title} ${task.completed ? styles.titleDone : ""}`}>
                            {task.title}
                        </span>
                    </div>

                    <div className={styles.meta}>
                        <span className={styles.priorityBadge} style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
                            {PRIORITY_LABELS[task.priority]}
                        </span>

                        {/* List label badge */}
                        {listName && (
                            <span
                                className={styles.listBadge}
                                style={{
                                    color: listColor || "var(--muted)",
                                    borderColor: `${listColor || "#94a3b8"}40`,
                                    background: `${listColor || "#94a3b8"}12`,
                                }}
                            >
                                <span
                                    className={styles.listBadgeDot}
                                    style={{ background: listColor || "var(--muted)" }}
                                />
                                {listName}
                            </span>
                        )}

                        {task.module_code && (
                            <span className={styles.moduleBadge}>{task.module_code}</span>
                        )}

                        {due && (
                            <span className={`${styles.dueBadge} ${styles[due.status]}`}>
                                {due.status === "overdue" ? "⚠️" : "📅"} {due.label}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    {!task.completed && (
                        <button
                            className={styles.studyBtn}
                            title="Study now"
                            onClick={() => nav(`/timer?taskId=${task.id}`)}
                        >
                            ▶
                        </button>
                    )}
                    <div className={styles.menuWrap}>
                        <button
                            className={styles.menuBtn}
                            onClick={() => setShowMenu(p => !p)}
                        >
                            ···
                        </button>
                        {showMenu && (
                            <div className={styles.menu}>
                                <button
                                    className={styles.menuItem}
                                    onClick={() => { setShowEdit(true); setShowMenu(false); }}
                                >
                                    ✏️ Edit
                                </button>
                                <div className={styles.menuDivider} />
                                <button
                                    className={`${styles.menuItem} ${styles.menuDelete}`}
                                    onClick={() => { onDelete(); setShowMenu(false); }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showEdit && (
                <EditTaskModal
                    task={task}
                    onSave={data => onEdit(data)}
                    onClose={() => setShowEdit(false)}
                />
            )}
        </>
    );
}