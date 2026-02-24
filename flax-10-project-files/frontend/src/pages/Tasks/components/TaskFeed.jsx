import { useState, useMemo } from "react";
import TaskCard from "./TaskCard";
import styles from "./TaskFeed.module.css";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

const LIST_COLOURS = [
    "#6366f1", "#10b981", "#f59e0b", "#ec4899",
    "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16", "#f97316", "#94a3b8",
];

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

function Section({ title, emoji, tasks, sortBy, listMap, onToggleComplete, onDeleteTask, onEditTask, defaultCollapsed = false }) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    const sorted = useMemo(() => sortTasks(tasks, sortBy), [tasks, sortBy]);

    if (tasks.length === 0) return null;

    return (
        <div className={styles.section}>
            <button
                className={styles.sectionHeader}
                onClick={() => setCollapsed(c => !c)}
            >
                <span className={styles.sectionEmoji}>{emoji}</span>
                <span className={styles.sectionTitle}>{title}</span>
                <span className={styles.sectionBadge}>{tasks.length}</span>
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
                                listColor={list?.color || LIST_COLOURS[(list?.idx || 0) % LIST_COLOURS.length]}
                                onToggle={() => onToggleComplete(task.id)}
                                onDelete={() => onDeleteTask(task.id)}
                                onEdit={data => onEditTask(task.id, data)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function TaskFeed({ tasks, lists, activeFilter, onToggleComplete, onDeleteTask, onEditTask }) {
    const [search, setSearch]     = useState("");
    const [sortBy, setSortBy]     = useState("priority");
    const [showDone, setShowDone] = useState(false);

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

    const overdue  = filtered.filter(t => t.due_date && new Date(t.due_date) < now);
    const today    = filtered.filter(t => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= todayEnd);
    const thisWeek = filtered.filter(t => { if (!t.due_date) return false; const d = new Date(t.due_date); return d > todayEnd && d <= weekEnd; });
    const later    = filtered.filter(t => !t.due_date || new Date(t.due_date) > weekEnd);

    const hasAny = filtered.length > 0;

    const sectionProps = { sortBy, listMap, onToggleComplete, onDeleteTask, onEditTask };

    return (
        <div className={styles.feed}>
            {/* ── Toolbar — search + sort only ── */}
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
            </div>

            {/* ── Task sections ── */}
            <div className={styles.sections}>
                {!hasAny && (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🎉</span>
                        <p>{search ? `No tasks matching "${search}"` : "All clear — no tasks here!"}</p>
                    </div>
                )}

                {overdue.length > 0 && <Section title="Overdue" emoji="⚠️" tasks={overdue} {...sectionProps} />}
                <Section title="Today" emoji="📅" tasks={today} {...sectionProps} />
                <Section title="This week" emoji="📆" tasks={thisWeek} {...sectionProps} />
                <Section title="Later" emoji="🗓️" tasks={later} {...sectionProps} defaultCollapsed={later.length > 8} />

                {completed.length > 0 && (
                    <div className={styles.completedSection}>
                        <button className={styles.completedToggle} onClick={() => setShowDone(s => !s)}>
                            <span>✓ Completed</span>
                            <span className={styles.sectionBadge}>{completed.length}</span>
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
                                            listColor={list?.color || LIST_COLOURS[(list?.idx || 0) % LIST_COLOURS.length]}
                                            onToggle={() => onToggleComplete(task.id)}
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