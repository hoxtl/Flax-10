import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import DateTimePicker from "./DateTimePicker";
import styles from "./TaskCard.module.css";

function useActiveTimerTaskId() {
    const [id, setId] = useState(() => {
        try { return typeof window !== "undefined" ? sessionStorage.getItem("timerTaskId") : null; } catch (_) { return null; }
    });
    useEffect(() => {
        const onStorage = (e) => { if (e.key === "timerTaskId") setId(e.newValue); };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);
    return id;
}

/* Semantic left-border accents */
const PRIORITY_COLOURS = {
    urgent: "var(--urgent)",
    high:   "var(--study)",
    medium: "var(--personal)",
    low:    "var(--neutral)",
};

const PRIORITY_LABELS = {
    urgent: "Urgent",
    high:   "High",
    medium: "Medium",
    low:    "Low",
};

/* Monochromatic icons for action bar */
const IconPencil = () => (
    <svg className={styles.actionIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
);
const IconTrash = () => (
    <svg className={styles.actionIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
);
const IconPlay = () => (
    <svg className={styles.actionIcon} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
);

function formatDueDate(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((dueDay - today) / 86400000);

    if (diffDays < 0)  return { label: "Overdue",    status: "overdue" };
    if (diffDays === 0) return { label: "Today",     status: "today" };
    if (diffDays === 1) return { label: "Tomorrow", status: "thisWeek" };
    if (diffDays <= 7) return { label: `${diffDays} days`, status: "thisWeek" };
    return {
        label: due.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        status: "later",
    };
}

function EditTaskModal({ task, onSave, onDelete, onClose }) {
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

    const handleDelete = () => {
        onDelete?.();
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
                            <DateTimePicker
                                value={form.due_date}
                                onChange={val => set("due_date", val)}
                                placeholder="Pick date & time (optional)"
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.editFooter}>
                    <button type="button" className={styles.editDeleteLink} onClick={handleDelete}>
                        Delete task
                    </button>
                    <div className={styles.editFooterActions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TaskCard({ task, onToggle, onDelete, onEdit, listName, listColor, hideDueBadge = false, isOverdue = false }) {
    const [showEdit, setShowEdit] = useState(false);
    const nav = useNavigate();
    const activeTimerTaskId = useActiveTimerTaskId();
    const isActiveInTimer = activeTimerTaskId != null && String(task.id) === String(activeTimerTaskId);

    const due   = formatDueDate(task.due_date);
    const color = PRIORITY_COLOURS[task.priority] || "var(--neutral)";
    const accent = isOverdue ? "var(--urgent)" : color;

    return (
        <>
            <div
                className={`${styles.card} ${task.completed ? styles.cardDone : ""} ${isOverdue ? styles.cardOverdue : ""} ${isActiveInTimer ? styles.cardActiveTimer : ""}`}
                style={{ "--accent": accent }}
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

                {/* Main content — whole area opens edit (description in modal) */}
                <div
                    className={styles.content}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { if (!task.completed && !e.target.closest?.("button") && !e.target.closest?.("a")) setShowEdit(true); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !task.completed) setShowEdit(true); }}
                >
                    <div className={styles.titleRow}>
                        <span className={`${styles.title} ${styles.titleClickable} ${task.completed ? styles.titleDone : ""}`}>
                            {task.title}
                        </span>
                    </div>

                    <div className={styles.meta}>
                        <span className={styles.priorityBadge}>
                            {PRIORITY_LABELS[task.priority]}
                        </span>
                        {listName && (
                            <span className={styles.listBadge}>
                                <span
                                    className={styles.listBadgeDot}
                                    style={{ background: listColor || "var(--muted)" }}
                                />
                                {listName}
                            </span>
                        )}

                        {(task.module_code || task.moduleId != null || task.module_id != null) && (
                            <Link
                                to={task.moduleId != null || task.module_id != null
                                    ? `/modules?moduleId=${task.moduleId ?? task.module_id}`
                                    : `/modules?code=${encodeURIComponent(task.module_code)}`}
                                className={`${styles.bubble} ${styles.bubbleModule}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {task.module_code || `Module ${task.moduleId ?? task.module_id}`}
                            </Link>
                        )}

                        {(task.assignment_type || task.deadline_type) && (() => {
                            const t = (task.assignment_type || task.deadline_type || "").toLowerCase();
                            const label = t === "exam" ? "Exam" : t === "coursework" ? "Coursework" : t === "lab" ? "Lab" : task.assignment_type || task.deadline_type;
                            const cls = t === "exam" ? styles.bubbleExam : t === "coursework" ? styles.bubbleCoursework : styles.bubbleOther;
                            return <span className={`${styles.bubble} ${cls}`}>{label}</span>;
                        })()}

                        {due && !hideDueBadge && (
                            <span className={`${styles.dueBadge} ${styles[due.status]}`}>
                                {due.status === "overdue" ? "⚠️" : "📅"} {due.label}
                            </span>
                        )}
                    </div>
                </div>

                {/* Icon-only action bar: visible on hover, far right */}
                <div className={styles.actionBar}>
                    {!task.completed && (
                        <button
                            type="button"
                            className={styles.actionBarBtn}
                            title="Study now"
                            onClick={() => nav(`/timer?taskId=${task.id}`)}
                            aria-label="Study now"
                        >
                            <IconPlay />
                        </button>
                    )}
                    <button
                        type="button"
                        className={styles.actionBarBtn}
                        title="Edit"
                        onClick={() => setShowEdit(true)}
                        aria-label="Edit task"
                    >
                        <IconPencil />
                    </button>
                    <button
                        type="button"
                        className={`${styles.actionBarBtn} ${styles.actionBarBtnDanger}`}
                        title="Delete"
                        onClick={onDelete}
                        aria-label="Delete task"
                    >
                        <IconTrash />
                    </button>
                </div>
            </div>

            {showEdit && (
                <EditTaskModal
                    task={task}
                    onSave={data => onEdit(data)}
                    onDelete={onDelete}
                    onClose={() => setShowEdit(false)}
                />
            )}
        </>
    );
}