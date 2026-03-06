import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { Clock, Pencil, FolderInput, CalendarDays, Trash2, ChevronLeft, Flag, Zap, List, BookOpen, MousePointer2, ClipboardList, X } from "lucide-react";

import { useTimerContext } from "../../../context/TimerContext";
import { useTaskCompletion } from "../../../context/TaskCompletionContext";
import { getCompletionMessage, isRoutineTask } from "../../../lib/completionMessages";
import DateTimePicker from "./DateTimePicker";
import { CheckBurst } from "../../../components/TaskCelebration/CheckBurst";
import CreateTaskModal from "./CreateTaskModal";

import styles from "./TaskCard.module.css";

const MODULE_COLORS = [
    { text: "#5a4a3a", bg: "rgba(123, 103, 81, 0.10)", border: "rgba(123, 103, 81, 0.24)" },
    { text: "#615547", bg: "rgba(138, 125, 118, 0.12)", border: "rgba(138, 125, 118, 0.24)" },
    { text: "#6a5a45", bg: "rgba(150, 127, 98, 0.11)", border: "rgba(150, 127, 98, 0.25)" },
    { text: "#56515b", bg: "rgba(120, 112, 128, 0.10)", border: "rgba(120, 112, 128, 0.24)" },
    { text: "#4f5a63", bg: "rgba(106, 121, 133, 0.10)", border: "rgba(106, 121, 133, 0.24)" },
    { text: "#61584f", bg: "rgba(135, 123, 107, 0.10)", border: "rgba(135, 123, 107, 0.24)" },
    { text: "#5d544a", bg: "rgba(129, 116, 99, 0.10)", border: "rgba(129, 116, 99, 0.24)" },
    { text: "#564f47", bg: "rgba(118, 107, 95, 0.10)", border: "rgba(118, 107, 95, 0.24)" },
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
};
const PRIORITY_MARKS = {
    urgent: "❗❗❗",
    high: "❗❗",
    medium: "❗",
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
                            onClick={() => {
                                const fromList = (lists || []).find((x) => String(x.id) === String(task.task_list));
                                onEdit(
                                    { task_list: l.id },
                                    {
                                        source: "context-menu",
                                        action: "move-list",
                                        listId: l.id,
                                        listName: l.name,
                                        fromListId: task.task_list,
                                        fromListName: fromList?.name || null,
                                    }
                                );
                                onClose();
                            }}
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
                                onEdit(
                                    { due_date: val || null },
                                    { source: "context-menu", action: "set-due-date", dueDate: val || null }
                                );
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

function formatFocusBlocks(blocks) {
    const split = splitEstimatedBlocks(blocks);
    if (split) {
        const totalMins = split.sessionCount * split.workMinutes;
        return `${split.sessionCount} session${split.sessionCount === 1 ? "" : "s"} · ${totalMins}m`;
    }
    const total = Math.max(1, Number(blocks) || 1);
    for (const perSession of [1, 2, 3, 4]) {
        if (total % perSession !== 0) continue;
        const sessions = total / perSession;
        if (sessions >= 1 && sessions <= 12) {
            return `${sessions} session${sessions === 1 ? "" : "s"} · ${total * 25}m`;
        }
    }
    return `${total * 25}m total`;
}

function splitEstimatedBlocks(blocks) {
    const total = Math.max(1, Number(blocks) || 1);
    for (const perSession of [1, 2, 3, 4]) {
        if (total % perSession !== 0) continue;
        const sessions = total / perSession;
        if (sessions >= 1 && sessions <= 12) {
            return { sessionCount: sessions, workMinutes: perSession * 25 };
        }
    }
    return { sessionCount: 1, workMinutes: total * 25 };
}

/** Read-only task details modal — clean, scannable layout with clear hierarchy. */
function TaskInfoModal({ task, listName, onClose }) {
    const due = formatDueDate(task.due_date);
    const dueFormatted = task.due_date
        ? new Date(task.due_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
        : null;

    const modal = (
        <div className={styles.modalBackdrop} onMouseDown={onClose}>
            <div
                className={styles.infoModal}
                onMouseDown={e => e.stopPropagation()}
            >
                <div className={styles.infoModalAccent} aria-hidden />
                <div className={styles.infoModalHeader}>
                    <ClipboardList size={20} strokeWidth={1.5} className={styles.infoModalIcon} aria-hidden />
                    <div className={styles.infoModalHeaderText}>
                        <h3 className={styles.infoModalTitle}>Task details</h3>
                        <p className={styles.infoModalSub}>Quick glance</p>
                    </div>
                    <button type="button" className={styles.infoModalClose} onClick={onClose} aria-label="Close">
                        <X size={18} strokeWidth={2} aria-hidden />
                    </button>
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
                            <span className={styles.infoLabel}><Flag size={14} strokeWidth={2} /> Priority</span>
                            <span className={`${styles.infoVal} ${styles.infoValPill}`}>
                                {PRIORITY_LABELS[task.priority] || task.priority || "—"}
                            </span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}><Zap size={14} strokeWidth={2} /> Sessions</span>
                            <span className={`${styles.infoVal} ${styles.infoValPill}`}>
                                {formatFocusBlocks(task.estimated_blocks)}
                            </span>
                        </div>
                        <div className={styles.infoRowFull}>
                            <span className={styles.infoLabel}><Clock size={14} strokeWidth={2} /> Due date</span>
                            <span className={styles.infoVal}>{dueFormatted || due?.label || "—"}</span>
                        </div>
                        {listName && (
                            <div className={styles.infoRowFull}>
                                <span className={styles.infoLabel}><List size={14} strokeWidth={2} /> List</span>
                                <span className={styles.infoVal}>
                                    <span className={styles.infoListDot} />
                                    {listName}
                                </span>
                            </div>
                        )}
                        {task.module_code && (
                            <div className={styles.infoRowFull}>
                                <span className={styles.infoLabel}><BookOpen size={14} strokeWidth={2} /> Module</span>
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

export function EditTaskModal({ task, onSave, onDelete, onClose, lists = [] }) {
    return (
        <CreateTaskModal
            mode="edit"
            initialTask={task}
            defaultListId={task.task_list}
            lists={lists}
            onSave={onSave}
            onDeleteTask={onDelete}
            onClose={onClose}
        />
    );
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
    const { setActiveTaskId } = useTimerContext();
    const { showCompletionToast } = useTaskCompletion();
    const activeTimerTaskId = useActiveTimerTaskId();
    const isActiveInTimer = activeTimerTaskId != null && String(task.id) === String(activeTimerTaskId);

    const due = formatDueDate(task.due_date);
    const priorityKey = (task.priority || "").toLowerCase();
    const isVisualPriority = ["medium", "high", "urgent"].includes(priorityKey);
    const showPriorityText = isVisualPriority && !task.completed;

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
                        <span className={styles.titleMetaRight}>
                            {showPriorityText && (
                                <span className={`${styles.priorityText} ${styles[`priorityText_${priorityKey}`]}`}>
                                    <span className={styles.priorityMarks}>{PRIORITY_MARKS[priorityKey] || ""}</span>
                                    <span className={styles.priorityLabel}>{PRIORITY_LABELS[priorityKey] || "Priority"}</span>
                                </span>
                            )}
                            {due && !hideDueBadge && (
                                <span className={`${styles.dueLabel} ${task.completed && isCompletedSection ? styles.dueLabelCompleted : ""} ${styles[`due_${due.status}`]}`}>
                                    {(due.status === "tomorrow" || due.status === "today" || due.status === "overdue") && !(task.completed && isCompletedSection) && <Clock size={11} className={styles.duePillIcon} />}
                                    {task.completed && isCompletedSection ? getCompletedDueLabel(task.due_date) : due.label}
                                </span>
                            )}
                        </span>
                    </div>

                    <div className={`${styles.meta} ${task.completed ? styles.metaDone : ""}`}>
                        {listName && !hideListBadge && (
                            <span
                                className={styles.listIndicator}
                                style={{
                                    "--lc": listColor || "#a89890",
                                    background: `color-mix(in srgb, ${listColor || "#a89890"} 8%, transparent)`,
                                    borderColor: `color-mix(in srgb, ${listColor || "#a89890"} 18%, transparent)`,
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
                                    style={{ color: mc.text, background: "transparent", borderColor: mc.border }}
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
                                const split = splitEstimatedBlocks(task.estimated_blocks);
                                setActiveTaskId(task.id, {
                                    title: task.title,
                                    categoryColor: listColor || undefined,
                                    estimatedBlocks: Number(task.estimated_blocks || 1),
                                    estimatedSessionCount: split.sessionCount,
                                    estimatedWorkMinutes: split.workMinutes,
                                });
                                nav("/timer", { state: { fromTaskPlay: true } });
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
                    onClose={() => setShowInfo(false)}
                />
            )}

            {showEdit && (
                <EditTaskModal
                    task={task}
                    onSave={data => onEdit(data)}
                    onDelete={onDelete}
                    lists={lists}
                    onClose={() => setShowEdit(false)}
                />
            )}
        </>
    );
}
