import { useState, useMemo } from "react";

import TaskCard from "./TaskCard";
import CreateTaskBar from "./CreateTaskBar";
import ZenGardenEmptyState from "../../../components/ZenGardenEmptyState";
import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";

import styles from "./TaskFeed.module.css";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Routine/event tasks (meals, lectures, etc.) auto-pass when time has passed — exclude from Overdue. */
function isRoutineOrEventTask(task) {
  if (!task) return false;
  const title = (task.title || "").toLowerCase();
  const tag = (task.tag || "").toString().toLowerCase();
  if (tag === "routine" || tag === "event") return true;
  if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title)) return true;
  if (/lecture|seminar|tutorial|lab\s*session/i.test(title)) return true;
  return false;
}

function sortTasks(tasks, sortBy) {
    return [...tasks].sort((a, b) => {
        if (sortBy === "priority") {
            const pd = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
            if (pd !== 0) return pd;
            return new Date(a.due_date || 0) - new Date(b.due_date || 0);
        }
        if (sortBy === "due") {
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
        }
        if (sortBy === "alpha") return a.title.localeCompare(b.title);
        const pd = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
        if (pd !== 0) return pd;
        return new Date(a.due_date || 0) - new Date(b.due_date || 0);
    });
}

function getListColor(list) {
    if (list?.color) return list.color;
    try {
        if (list?.id && typeof window !== "undefined") {
            const s = localStorage.getItem("listColor:" + list.id);
            if (s) return s;
        }
    } catch (_) {}
    return FOCUS_BLOCK_COLOURS_HEX[(list?.idx ?? 0) % FOCUS_BLOCK_COLOURS_HEX.length];
}

function Section({ title, emoji, tasks, sortBy, listMap, onToggleComplete, onDeleteTask, onEditTask, defaultCollapsed = false, hideDueBadge = false, isOverdueSection = false }) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const sorted = useMemo(() => sortTasks(tasks, sortBy), [tasks, sortBy]);

    if (tasks.length === 0) return null;

    return (
        <div className={`${styles.section} ${isOverdueSection ? styles.sectionOverdue : ""}`}>
            <button
                className={`${styles.sectionHeader} ${isOverdueSection ? styles.sectionHeaderDanger : ""}`}
                onClick={() => setCollapsed(c => !c)}
            >
                <span className={styles.sectionEmoji}>{emoji}</span>
                <span className={styles.sectionTitle}>{title}</span>
                <span className={styles.sectionCountCircle} aria-label={`${tasks.length} tasks`}>{tasks.length}</span>
                <span className={styles.sectionChevron}>{collapsed ? "▶" : "▼"}</span>
            </button>

            {!collapsed && (
                <div className={styles.sectionBody}>
                    {sorted.map(task => {
                        const list = listMap[String(task.task_list)];
                        return (
                            <TaskCard
                                key={task.id}
                                task={task}
                                listName={list?.name}
                                listColor={getListColor(list)}
                                onToggle={() => onToggleComplete(task.id, task.completed)}
                                onDelete={() => onDeleteTask(task.id)}
                                onEdit={data => onEditTask(task.id, data)}
                                hideDueBadge={hideDueBadge}
                                isOverdue={isOverdueSection}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function TaskFeed({
    tasks,
    lists,
    activeFilter,
    activeListId,
    defaultDueDateForNewTask,
    onToggleComplete,
    onDeleteTask,
    onEditTask,
    onCreateTask,
    onAddTask,
}) {
    const [search, setSearch]     = useState("");
    const [sortBy, setSortBy]     = useState("priority");
    const [showDone, setShowDone] = useState(true);

    // Build list lookup map: id → { name, color, idx }
    const listMap = useMemo(() => {
        const map = {};
        (lists || []).forEach((l, idx) => {
            map[String(l.id)] = { ...l, idx };
        });
        return map;
    }, [lists]);

    const pending   = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);

    const filtered = useMemo(() => {
        if (!search.trim()) return pending;
        const q = search.toLowerCase();
        return pending.filter(t =>
            t.title.toLowerCase().includes(q) ||
            (t.description || "").toLowerCase().includes(q) ||
            (t.module_code || "").toLowerCase().includes(q)
        );
    }, [pending, search]);

    const now      = new Date();
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd  = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);

    const overdue  = filtered.filter(t => t.due_date && new Date(t.due_date) < now && !t.completed && !isRoutineOrEventTask(t));
    const today    = filtered.filter(t => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= todayEnd);
    const thisWeek = filtered.filter(t => { if (!t.due_date) return false; const d = new Date(t.due_date); return d > todayEnd && d <= weekEnd; });
    const later    = filtered.filter(t => !t.due_date || new Date(t.due_date) > weekEnd);

    const hasAny = filtered.length > 0;

    const isZenEmpty = tasks.length === 0 || pending.length === 0;
    const allCompleted = tasks.length > 0 && pending.length === 0;
    const showZenEmptyState = !hasAny && isZenEmpty;
    const showSearchEmptyState = !hasAny && !isZenEmpty;

    const zenMessage = allCompleted
      ? "The slate is clean. You've mastered your momentum for now. ✨"
      : null;
    const zenCtaLabel = allCompleted ? "Plan a new session" : "Add a new seed";

    const displayName = useMemo(() => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (!raw) return null;
        const u = JSON.parse(raw);
        return (u.first_name || "").trim() || (u.username || "").trim() || null;
      } catch {
        return null;
      }
    }, []);

    const sectionProps = { sortBy, listMap, onToggleComplete, onDeleteTask, onEditTask };

    return (
        <div className={styles.feed}>
            {/* Create Task bar — single-line entry; always visible */}
            {onAddTask && (
                <div className={styles.createBarWrap}>
                    <span className={styles.quickCaptureLabel}>Quick Capture</span>
                    <CreateTaskBar
                        lists={lists}
                        defaultListId={activeListId}
                        defaultDueDate={defaultDueDateForNewTask}
                        onAddTask={onAddTask}
                    />
                </div>
            )}

            {/* Toolbar — search + sort + full modal trigger */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        className={styles.searchInput}
                        placeholder="Search tasks…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className={styles.searchClear} onClick={() => setSearch("")}>✕</button>
                    )}
                </div>

                <div className={styles.sortWrap}>
                    <label className={styles.sortLabel}>SORT</label>
                    <select
                        className={styles.sortSelect}
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                    >
                        <option value="priority">Priority</option>
                        <option value="due">Due date</option>
                        <option value="alpha">A → Z</option>
                    </select>
                </div>

                {onCreateTask && (
                    <button
                        type="button"
                        className={styles.addBtn}
                        onClick={onCreateTask}
                    >
                        + Full Planning
                    </button>
                )}
            </div>

            {/* Task sections or empty state — below Create Task bar, never overlapping */}
            <div className={styles.sections}>
                {showZenEmptyState && (
                    <div className={styles.emptyState}>
                      <ZenGardenEmptyState
                        displayName={displayName}
                        sub={null}
                        message={zenMessage}
                        action={
                          onCreateTask ? (
                            <button
                              type="button"
                              className={styles.emptyStateAddBtn}
                              onClick={onCreateTask}
                            >
                              {zenCtaLabel}
                            </button>
                          ) : null
                        }
                      />
                    </div>
                )}

                {showSearchEmptyState && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyStateIcon} aria-hidden>🔍</span>
                        <p className={styles.emptyStateText}>
                            No tasks match "{search}"
                        </p>
                    </div>
                )}

                {overdue.length > 0 && <Section title="Overdue" emoji="⚠️" tasks={overdue} hideDueBadge isOverdueSection {...sectionProps} />}
                <Section title="Today" emoji="📅" tasks={today} hideDueBadge {...sectionProps} />
                <Section title="This week" emoji="📆" tasks={thisWeek} {...sectionProps} />
                <Section title="Later" emoji="🗓️" tasks={later} {...sectionProps} defaultCollapsed={later.length > 8} />

                {completed.length > 0 && (
                    <div className={styles.completedSection}>
                        <button className={styles.completedToggle} onClick={() => setShowDone(s => !s)}>
                            <span>🌱 Recently Harvested</span>
                            <span className={styles.completedSub}>Completed</span>
                            <span className={styles.sectionCountCircle} aria-label={`${completed.length} tasks`}>{completed.length}</span>
                            <span className={styles.sectionChevron}>{showDone ? "▼" : "▶"}</span>
                        </button>
                        {showDone && (
                            <div className={styles.completedCards}>
                                {sortTasks(completed, sortBy).map(task => {
                                    const list = listMap[String(task.task_list)];
                                    return (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            listName={list?.name}
                                            listColor={getListColor(list)}
                                            onToggle={() => onToggleComplete(task.id, task.completed)}
                                            onDelete={() => onDeleteTask(task.id)}
                                            onEdit={data => onEditTask(task.id, data)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}