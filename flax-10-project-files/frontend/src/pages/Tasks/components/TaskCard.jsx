import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

import { useTimerContext } from "../../../context/TimerContext";
import { useHarvestCelebration } from "../../../context/HarvestCelebrationContext";
import { getHarvestMessage, isRoutineHarvestTask } from "../../../lib/harvestMessages";
import DateTimePicker from "./DateTimePicker";
import { SeedBurst } from "../../../components/HarvestCelebration/SeedBurst";
import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";

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

    if (diffDays < 0) return { label: "Overdue", status: "overdue" };
    if (diffDays === 0) return { label: "Today", status: "today" };
    if (diffDays === 1) return { label: "Tomorrow", status: "tomorrow" };
    return null;
}

export function EditTaskModal({ task, onSave, onDelete, onClose }) {
    const [form, setForm] = useState({
        title:       task.title,
        description: task.description || "",
        priority:    task.priority,
        energy_level: task.energy_level || task.energyLevel || "medium",
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

    const modal = (
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
                            <AnimatedDropdown
                                value={form.priority}
                                onChange={val => set("priority", val)}
                                placeholder="Select priority"
                                options={[
                                    { value: "low",    label: "Low"    },
                                    { value: "medium", label: "Medium" },
                                    { value: "high",   label: "High"   },
                                    { value: "urgent", label: "Urgent" },
                                ]}
                            />
                        </div>
                        <div className={styles.editField}>
                            <label className={styles.editLabel}>Energy</label>
                            <AnimatedDropdown
                                value={form.energy_level}
                                onChange={val => set("energy_level", val)}
                                placeholder="Select energy"
                                options={[
                                    { value: "low",    label: "Low"    },
                                    { value: "medium", label: "Medium" },
                                    { value: "high",   label: "High"   },
                                ]}
                            />
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
    return createPortal(modal, document.body);
}

export default function TaskCard({ task, onToggle, onDelete, onEdit, listName, listColor, hideDueBadge = false, hideListBadge = false, isOverdue = false }) {
    const [showEdit, setShowEdit] = useState(false);
    const [seedPop, setSeedPop] = useState(false);
    const seedPopTimeoutRef = useRef(null);
    const nav = useNavigate();
    const { setActiveTaskId } = useTimerContext();
    const { showHarvestToast } = useHarvestCelebration();
    const activeTimerTaskId = useActiveTimerTaskId();
    const isActiveInTimer = activeTimerTaskId != null && String(task.id) === String(activeTimerTaskId);

    const due   = formatDueDate(task.due_date);
    const showPriority = task.priority === "urgent" || task.priority === "high";

    const handleCheckClick = () => {
        const wasIncomplete = !task.completed;
        const isRoutine = isRoutineHarvestTask(task);
        if (wasIncomplete) {
            if (!isRoutine) setSeedPop(true);
            const messageContext = { isOverdue, dueStatus: due?.status };
            showHarvestToast(getHarvestMessage(task, messageContext), { isRoutine });
            if (!isRoutine && seedPopTimeoutRef.current) clearTimeout(seedPopTimeoutRef.current);
            if (!isRoutine) {
                seedPopTimeoutRef.current = setTimeout(() => {
                    setSeedPop(false);
                    seedPopTimeoutRef.current = null;
                }, 500);
            }
        }
        onToggle();
    };

    useEffect(() => () => { if (seedPopTimeoutRef.current) clearTimeout(seedPopTimeoutRef.current); }, []);

    return (
        <>
            <div
                className={`${styles.card} ${task.completed ? styles.cardDone : ""} ${isOverdue ? styles.cardOverdue : ""} ${isActiveInTimer ? styles.cardActiveTimer : ""}`}
                style={{ "--list-color": listColor || "#a89890" }}
            >
                {/* Checkbox with seed burst */}
                <SeedBurst active={seedPop}>
                <button
                    className={`${styles.check} ${task.completed ? styles.checkDone : ""}`}
                    onClick={handleCheckClick}
                    title={task.completed ? "Mark incomplete" : "Mark complete"}
                >
                    {task.completed && <span className={styles.checkMark}>✓</span>}
                </button>
                </SeedBurst>

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
                        {showPriority && (
                            <span className={styles.priorityBadge}>
                                {PRIORITY_LABELS[task.priority]}
                            </span>
                        )}
                        {listName && !hideListBadge && (
                            <span className={styles.listBadge}>
                                <span
                                    className={styles.listBadgeDot}
                                    style={{ background: listColor || "var(--muted)" }}
                                />
                                {listName}
                            </span>
                        )}

                        {task.module_code && (
                            <span className={styles.moduleCode}>
                                {task.module_code}
                            </span>
                        )}

                        {due && !hideDueBadge && (
                            <span className={`${styles.dueBadge} ${styles[due.status]}`}>
                                {due.label}
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
                            onClick={() => {
                                setActiveTaskId(task.id, { title: task.title, categoryColor: listColor || undefined });
                                nav("/timer", { state: { fromTaskPlay: true } });
                            }}
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
