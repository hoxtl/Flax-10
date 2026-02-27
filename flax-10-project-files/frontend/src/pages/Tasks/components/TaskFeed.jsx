import { useState, useMemo } from "react";

import TaskCard from "./TaskCard";
import CreateTaskBar from "./CreateTaskBar";
import EmptyStateCard from "../../../components/EmptyStateCard";
import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";

import styles from "./TaskFeed.module.css";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Subtitle by list type for dynamic header. */
function getListSubtitle(listName, listCategory, isEmpty) {
  if (isEmpty) return "This garden is currently empty. Ready to plant some goals?";
  const name = (listName || "").toLowerCase();
  const cat = (listCategory || "").toLowerCase();
  if (cat === "uni" || /university|academic|reading list/i.test(name)) return "Academic excellence is a marathon, not a sprint. Focus on your core objectives.";
  if (cat === "personal" || /personal|health|wellness|finance|home/i.test(name)) return "Nurturing the gardener is as important as tending the garden. Balance is key.";
  if (cat === "society" || /internship|work|project|admin/i.test(name)) return "Brick by brick, system by system. Building the future one task at a time.";
  return "A clear mind leads to a clear path. What is the next right move for today?";
}

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
    activeModuleCode,
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

    const activeList = useMemo(() => {
      if (!activeListId || !lists?.length) return null;
      return lists.find(l => String(l.id) === String(activeListId)) || null;
    }, [activeListId, lists]);

    const headerTitle = activeList
        ? (activeModuleCode ? `${activeList.name || "List"}: ${activeModuleCode}` : (activeList.name || "List"))
        : (activeModuleCode || "All tasks");
    const headerSubtitle = getListSubtitle(
      activeList?.name,
      activeList?.category,
      tasks.length === 0
    );

    const sectionProps = { sortBy, listMap, onToggleComplete, onDeleteTask, onEditTask };

    return (
        <div className={styles.feed}>
            {/* Dynamic list header — title (max 50%, ellipsis) | zen gap | subtitle under; grid-aligned */}
            <header className={styles.listHeader} key={activeListId ?? "all"}>
                <div className={styles.listHeaderTitleWrap}>
                    <h1 className={styles.listHeaderTitle} title={headerTitle}>{headerTitle}</h1>
                    <p className={styles.listHeaderSubtitle}>{headerSubtitle}</p>
                </div>
                <div className={styles.listHeaderZen} aria-hidden />
                <div className={styles.listHeaderDivider} aria-hidden />
            </header>

            {/* Sub-header: Identity (Quick Capture) left | Zen gap | Global Actions (Search, Sort, + Full Planning) right */}
            <div className={styles.subHeader}>
                {onAddTask ? (
                    <div className={styles.createBarWrap}>
                        <span className={styles.quickCaptureLabel}>Quick Capture</span>
                        <CreateTaskBar
                            lists={lists}
                            defaultListId={activeListId}
                            defaultDueDate={defaultDueDateForNewTask}
                            onAddTask={onAddTask}
                        />
                    </div>
                ) : (
                    <div className={styles.subHeaderSpacer} aria-hidden />
                )}
                <div className={styles.toolbar}>
                    <div className={styles.searchWrap}>
                        <span className={styles.searchIcon} aria-hidden>🔍</span>
                        <input
                            className={styles.searchInput}
                            placeholder="Search tasks…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className={styles.searchClear} onClick={() => setSearch("")} aria-label="Clear search">✕</button>
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
            </div>

            {/* Task sections or empty state — inside sectionsWrap so overflow is contained and header dropdowns are not clipped */}
            <div className={styles.sectionsWrap}>
            <div className={styles.sections}>
                {showZenEmptyState && (
                    <div className={styles.emptyState}>
                      <EmptyStateCard
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
        </div>
    );
}