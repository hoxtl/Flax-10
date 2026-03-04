import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { Clock, Pencil, FolderInput, CalendarDays, Trash2, ChevronLeft, Flag, Zap, List, BookOpen, MousePointer2 } from "lucide-react";

import { useTimerContext } from "../../../context/TimerContext";
import { useTaskCompletion } from "../../../context/TaskCompletionContext";
import { useAppNav } from "../../../context/AppNavContext";
import { getCompletionMessage, isRoutineTask } from "../../../lib/completionMessages";
import DateTimePicker from "./DateTimePicker";
import { CheckBurst } from "../../../components/TaskCelebration/CheckBurst";
import AnimatedDropdown from "../../../components/ui/AnimatedDropdown";

import styles from "./TaskCard.module.css";

const MODULE_COLORS = [
    { text: "#9a3412", bg: "rgba(251, 146, 60, 0.18)", border: "rgba(234, 88, 12, 0.35)" },    // orange
    { text: "#1d4ed8", bg: "rgba(96, 165, 250, 0.18)", border: "rgba(59, 130, 246, 0.35)" },    // blue
    { text: "#15803d", bg: "rgba(74, 222, 128, 0.16)", border: "rgba(22, 163, 74, 0.32)" },     // green
    { text: "#7e22ce", bg: "rgba(192, 132, 252, 0.16)", border: "rgba(147, 51, 234, 0.32)" },   // purple
    { text: "#b45309", bg: "rgba(252, 211, 77, 0.20)", border: "rgba(245, 158, 11, 0.35)" },    // amber
    { text: "#be123c", bg: "rgba(251, 113, 133, 0.16)", border: "rgba(225, 29, 72, 0.30)" },    // rose
    { text: "#0e7490", bg: "rgba(34, 211, 238, 0.15)", border: "rgba(6, 182, 212, 0.32)" },     // cyan
    { text: "#4338ca", bg: "rgba(165, 180, 252, 0.18)", border: "rgba(99, 102, 241, 0.32)" },   // indigo
];

function getModuleColor(code) {
    let hash = 0;
    for (let i = 0; i < code.length; i++) hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
    return MODULE_COLORS[Math.abs(hash) % MODULE_COLORS.length];
}

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

/* Monochromatic icons */
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
    if (diffDays <= 7) return { label: due.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }), status: "future" };
    return { label: due.toLocaleDateString(undefined, { month: "short", day: "numeric" }), status: "future" };
}

/** For completed tasks in Completed section: "Completed today" / "Completed yesterday" / "Completed [date]" */
function getCompletedDueLabel(dueDate) {
    if (!dueDate) return "Completed";
    const due = new Date(dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((dueDay - today) / 86400000);
    if (diffDays === 0) return "Completed today";
    if (diffDays === -1) return "Completed yesterday";
    return `Completed ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/** Highlight search query matches inside a text string. */
function HighlightText({ text, query }) {
    if (!query || !text) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark className={styles.searchHighlight}>{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    );
}

/**
 * Right-click context menu — Edit, Move to list, Set due date, Delete.
 * Renders as a portal so it's never clipped by parent overflow.
 */
function ContextMenu({ task, onEditOpen, onDelete, onEdit, lists, pos, onClose }) {
    const menuRef = useRef(null);
    const [view, setView] = useState("main");
    const [dueValue, setDueValue] = useState(task.due_date ? task.due_date.slice(0, 16) : "");

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const menu = (
        <div
            ref={menuRef}
            className={styles.ctxMenu}
            style={{ top: pos.y, left: pos.x }}
            onMouseDown={e => e.stopPropagation()}
        >
            {view === "main" && (
                <>
                    <button className={styles.ctxItem} onClick={() => { onEditOpen(); onClose(); }}>
                        <Pencil size={14} strokeWidth={2} /> Edit
                    </button>
                    {(lists?.length > 0) && (
                        <button className={styles.ctxItem} onClick={() => setView("move")}>
                            <FolderInput size={14} strokeWidth={2} /> Move to list
                        </button>
                    )}
                    <button className={styles.ctxItem} onClick={() => setView("due")}>
                        <CalendarDays size={14} strokeWidth={2} /> Set due date
                    </button>
                    <div className={styles.ctxDivider} />
                    <button className={`${styles.ctxItem} ${styles.ctxItemDanger}`} onClick={() => { onDelete(); onClose(); }}>
                        <Trash2 size={14} strokeWidth={2} /> Delete
                    </button>
                </>
            )}
            {view === "move" && (
                <>
                    <button className={styles.ctxBack} onClick={() => setView("main")}>
                        <ChevronLeft size={14} strokeWidth={2} /> Back
                    </button>
                    <div className={styles.ctxDivider} />
                    {(lists || []).map(l => (
                        <button
                            key={l.id}
                            className={`${styles.ctxItem} ${String(task.task_list) === String(l.id) ? styles.ctxItemActive : ""}`}
                            onClick={() => { onEdit({ task_list: l.id }); onClose(); }}
                        >
                            <span className={styles.ctxListDot} style={{ background: l.color }} />
                            {l.name}
                        </button>
                    ))}
                </>
            )}
            {view === "due" && (
                <>
                    <button className={styles.ctxBack} onClick={() => setView("main")}>
                        <ChevronLeft size={14} strokeWidth={2} /> Back
                    </button>
                    <div className={styles.ctxDivider} />
                    <div className={styles.ctxDateWrap}>
                        <DateTimePicker
                            value={dueValue}
                            onChange={val => {
                                setDueValue(val);
                                onEdit({ due_date: val || null });
                                onClose();
                            }}
                            placeholder="Pick date & time"
                        />
                    </div>
                </>
            )}
        </div>
    );
    return createPortal(menu, document.body);
}

const ENERGY_LABELS = {
    low: "Low",
    medium: "Medium",
    high: "High",
};

/** Read-only task details modal — classy, warm design. Shown when user clicks the task card. */
function TaskInfoModal({ task, listName, listColor, onClose }) {
    const due = formatDueDate(task.due_date);
    const dueFormatted = task.due_date
        ? new Date(task.due_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
        : null;

    const modal = (
        <div className={styles.modalBackdrop} onMouseDown={onClose}>
            <div
                className={styles.infoModal}
                style={{ "--info-accent": listColor || "#84A98C" }}
                onMouseDown={e => e.stopPropagation()}
            >
                <div className={styles.infoModalAccent} aria-hidden />
                <div className={styles.infoModalHeader}>
                    <span className={styles.infoModalIcon} aria-hidden>📋</span>
                    <div className={styles.infoModalHeaderText}>
                        <h3 className={styles.infoModalTitle}>Task details</h3>
                        <p className={styles.infoModalSub}>Quick glance</p>
                    </div>
                    <button className={styles.infoModalClose} onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className={styles.infoModalBody}>
                    <div className={styles.infoHero}>
                        <p className={styles.infoHeroTitle}>{task.title || "—"}</p>
                        {(task.description || "").trim() && (
                            <p className={styles.infoHeroDesc}>{task.description}</p>
                        )}
                    </div>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}><Flag size={12} strokeWidth={2} /> Priority</span>
                            <span className={styles.infoVal}>{PRIORITY_LABELS[task.priority] || task.priority || "—"}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}><Zap size={12} strokeWidth={2} /> Energy</span>
                            <span className={styles.infoVal}>{ENERGY_LABELS[task.energy_level || task.energyLevel] || "—"}</span>
                        </div>
                        <div className={styles.infoRowFull}>
                            <span className={styles.infoLabel}><Clock size={12} strokeWidth={2} /> Due date</span>
                            <span className={styles.infoVal}>{dueFormatted || due?.label || "—"}</span>
                        </div>
                        {listName && (
                            <div className={styles.infoRowFull}>
                                <span className={styles.infoLabel}><List size={12} strokeWidth={2} /> List</span>
                                <span className={styles.infoVal}>
                                    <span className={styles.infoListDot} style={{ background: listColor || "var(--muted)" }} />
                                    {listName}
                                </span>
                            </div>
                        )}
                        {task.module_code && (
                            <div className={styles.infoRowFull}>
                                <span className={styles.infoLabel}><BookOpen size={12} strokeWidth={2} /> Module</span>
                                <span className={styles.infoVal}>{task.module_code}{task.module_name ? ` — ${task.module_name}` : ""}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.infoModalFooter}>
                    <span className={styles.infoHint}>
                        <MousePointer2 size={12} strokeWidth={2} /> Right-click the task to edit or delete
                    </span>
                    <button type="button" className={styles.infoCloseBtn} onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
    return createPortal(modal, document.body);
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
                        <div className={styles.editField} style={{ gridColumn: "1 / -1" }}>
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

export default function TaskCard({
    task, onToggle, onDelete, onEdit, listName, listColor, lists,
    hideDueBadge = false, hideListBadge = false, isOverdue = false,
    searchQuery = "", isCompletedSection = false,
}) {
    const [showInfo, setShowInfo] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [ctxMenu, setCtxMenu] = useState(null);
    const [burstPop, setBurstPop] = useState(false);
    const [checkBounce, setCheckBounce] = useState(false);
    const burstTimeoutRef = useRef(null);
    const nav = useNavigate();
    const { setActiveNav } = useAppNav() || {};
    const { setActiveTaskId } = useTimerContext();
    const { showCompletionToast } = useTaskCompletion();
    const activeTimerTaskId = useActiveTimerTaskId();
    const isActiveInTimer = activeTimerTaskId != null && String(task.id) === String(activeTimerTaskId);

    const due = formatDueDate(task.due_date);
    const showPriority = task.priority === "urgent" || task.priority === "high";

    const handleCheckClick = () => {
        const wasIncomplete = !task.completed;
        const routine = isRoutineTask(task);
        if (wasIncomplete) {
            if (!routine) {
                setBurstPop(true);
                setCheckBounce(true);
                setTimeout(() => setCheckBounce(false), 400);
            }
            const messageContext = { isOverdue, dueStatus: due?.status };
            showCompletionToast(getCompletionMessage(task, messageContext), { isRoutine: routine });
            if (!routine && burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current);
            if (!routine) {
                burstTimeoutRef.current = setTimeout(() => {
                    setBurstPop(false);
                    burstTimeoutRef.current = null;
                }, 500);
            }
        }
        onToggle();
    };

    useEffect(() => () => { if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current); }, []);

    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    }, []);

    const accentCls = !task.completed && task.priority === "urgent"
        ? styles.cardAccentUrgent
        : !task.completed && task.priority === "high"
        ? styles.cardAccentHigh
        : !task.completed && task.priority === "medium"
        ? styles.cardAccentMedium
        : !task.completed && (task.priority === "low" || !task.priority)
        ? styles.cardAccentLow
        : "";

    return (
        <>
            <div
                className={`${styles.card} ${task.completed ? styles.cardDone : ""} ${task.completed && isCompletedSection ? styles.cardCompletedRow : ""} ${isOverdue ? styles.cardOverdue : ""} ${isActiveInTimer ? styles.cardActiveTimer : ""} ${accentCls}`}
                style={{ "--list-color": listColor || "#a89890" }}
                onContextMenu={handleContextMenu}
                title="Right-click for more options"
            >
                <CheckBurst active={burstPop}>
                    <button
                        className={`${styles.check} ${task.completed ? styles.checkDone : ""} ${task.completed && isCompletedSection ? styles.checkDoneCompleted : ""} ${checkBounce ? styles.checkBounce : ""}`}
                        onClick={handleCheckClick}
                        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                    >
                        {task.completed && (
                          <span className={styles.checkMark}>✓</span>
                        )}
                    </button>
                </CheckBurst>

                <div
                    className={styles.content}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { if (!e.target.closest?.("button") && !e.target.closest?.("a")) setShowInfo(true); }}
                    onKeyDown={(e) => { if (e.key === "Enter") setShowInfo(true); }}
                >
                    <div className={styles.titleRow}>
                        <span className={`${styles.title} ${styles.titleClickable} ${task.completed ? styles.titleDone : ""}`}>
                            <HighlightText text={task.title} query={searchQuery} />
                        </span>
                        {due && !hideDueBadge && (
                            <span className={`${styles.dueLabel} ${task.completed && isCompletedSection ? styles.dueLabelCompleted : ""} ${styles[`due_${due.status}`]}`}>
                                {(due.status === "tomorrow" || due.status === "today" || due.status === "overdue") && !(task.completed && isCompletedSection) && <Clock size={11} className={styles.duePillIcon} />}
                                {task.completed && isCompletedSection ? getCompletedDueLabel(task.due_date) : due.label}
                            </span>
                        )}
                    </div>

                    <div className={`${styles.meta} ${task.completed ? styles.metaDone : ""}`}>
                        {showPriority && (
                            <span className={`${styles.priorityPill} ${styles[`priority_${task.priority}`]}`}>
                                {PRIORITY_LABELS[task.priority]}
                            </span>
                        )}
                        {listName && !hideListBadge && (
                            <span
                                className={styles.listIndicator}
                                style={{
                                    "--lc": listColor || "#a89890",
                                    background: `color-mix(in srgb, ${listColor || "#a89890"} 12%, transparent)`,
                                    borderColor: `color-mix(in srgb, ${listColor || "#a89890"} 25%, transparent)`,
                                }}
                            >
                                <span className={styles.listDot} style={{ background: listColor || "var(--muted)" }} />
                                {listName}
                            </span>
                        )}
                        {task.module_code && (() => {
                            const mc = getModuleColor(task.module_code);
                            const moduleId = task.module_id ?? task.module ?? task.moduleId;
                            const to = moduleId
                                ? `/modules?moduleId=${moduleId}`
                                : `/modules?code=${encodeURIComponent(task.module_code)}`;
                            return (
                                <Link
                                    to={to}
                                    className={`${styles.modulePill} ${styles.modulePillLink}`}
                                    style={{ color: mc.text, background: mc.bg, borderColor: mc.border }}
                                    onClick={(e) => e.stopPropagation()}
                                    title={`Open ${task.module_code} module`}
                                >
                                    {task.module_code}
                                </Link>
                            );
                        })()}
                    </div>
                </div>

                {!task.completed && (
                    <div className={styles.actionBar}>
                        <button
                            type="button"
                            className={`${styles.actionBarBtn} ${styles.actionBarBtnPlay}`}
                            onClick={() => {
                                setActiveTaskId(task.id, { title: task.title, categoryColor: listColor || undefined });
                                setActiveNav?.("timer");
                                nav("/timer", { state: { fromTaskPlay: true, taskId: task.id, taskTitle: task.title } });
                            }}
                            aria-label="Study now"
                        >
                            <IconPlay />
                        </button>
                    </div>
                )}
            </div>

            {ctxMenu && (
                <ContextMenu
                    task={task}
                    onEditOpen={() => setShowEdit(true)}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    lists={lists}
                    pos={ctxMenu}
                    onClose={() => setCtxMenu(null)}
                />
            )}

            {showInfo && (
                <TaskInfoModal
                    task={task}
                    listName={listName}
                    listColor={listColor}
                    onClose={() => setShowInfo(false)}
                />
            )}

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
