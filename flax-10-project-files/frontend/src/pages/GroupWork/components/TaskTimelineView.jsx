import React, { useMemo, useState, useRef } from "react";
import TaskAssigneePopup from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import { getPriorityStyle } from "../utils/priorityUtils";
import { buildToggleAssignee, getDueDateStr } from "../utils/taskUtils";
import styles from "./TaskTimelineView.module.css";


// Helper to determine week/day index
// We'll anchor the timeline to "this week's Monday"
function getTimelineAnchor() {
    const now = new Date();
    const day = now.getDay() || 7; // make Sunday = 7
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Logic helpers for TaskTimelineView
function buildWeeks(anchor) {
    return Array.from({ length: 8 }).map((_, offset) => {
        const start = new Date(anchor.getTime() + offset * WEEK_MS);
        const end = new Date(start.getTime() + 5 * DAY_MS);
        const startStr = start.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        return {
            id: offset, label: `Week ${offset + 1} (${startStr}–${endStr})`,
            startTs: start.getTime(), endTs: end.getTime() + DAY_MS
        };
    });
}

function placeTasksIntoWeeks(tasks, weeks) {
    const layout = Array.from({ length: weeks.length }, () => Array.from({ length: 6 }, () => []));
    tasks.forEach(t => {
        if (!t.due_date || t.completed || t.status === "done") return;
        const ts = new Date(t.due_date).getTime();
        const wkIdx = weeks.findIndex(w => ts >= w.startTs && ts < w.endTs);
        if (wkIdx !== -1) {
            const dayIdx = (new Date(ts).getDay() + 6) % 7;
            if (dayIdx < 6) layout[wkIdx][dayIdx].push(t);
        }
    });
    return layout;
}

export default function TaskTimelineView({ tasks, members, onUpdate }) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const anchorMonday = useMemo(() => getTimelineAnchor(), []);
    const [page, setPage] = useState(0);
    const WEEKS_PER_PAGE = 3;

    const weeks = useMemo(() => buildWeeks(anchorMonday), [anchorMonday]);
    const placedTasks = useMemo(() => placeTasksIntoWeeks(tasks, weeks), [tasks, weeks]);
    const unscheduledTasks = useMemo(() => tasks.filter(t => !t.due_date && !t.completed && t.status !== "done"), [tasks]);

    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("text/plain", String(taskId));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add(styles.timelineCellDropTarget);
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove(styles.timelineCellDropTarget);
    };

    const handleDrop = (e, ts) => {
        e.preventDefault();
        e.currentTarget.classList.remove(styles.timelineCellDropTarget);
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
            // Assign due date as 12:00 PM on that day to avoid timezone shifts
            const date = new Date(ts);
            date.setHours(12, 0, 0, 0);
            onUpdate(Number(taskId), { due_date: date.toISOString() });
        }
    };

    const handleDragOverWidget = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add(styles.widgetListDropTarget);
    };

    const handleDragLeaveWidget = (e) => {
        e.currentTarget.classList.remove(styles.widgetListDropTarget);
    };

    const handleDropWidget = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove(styles.widgetListDropTarget);
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
            onUpdate(Number(taskId), { due_date: null });
        }
    };

    const totalPages = Math.ceil(weeks.length / WEEKS_PER_PAGE);
    const visibleWeeks = weeks.slice(page * WEEKS_PER_PAGE, (page + 1) * WEEKS_PER_PAGE);

    return (
        <div className={styles.viewContainer}>
            {/* Unscheduled Widget (Left Sidebar) */}
            <div className={styles.unscheduledWidget}>
                <div className={styles.widgetHeader}>
                    <h3 className={styles.widgetTitle}>
                        Unscheduled
                        <span className={styles.widgetCount}>{unscheduledTasks.length}</span>
                    </h3>
                </div>
                <div
                    className={styles.widgetList}
                    onDragOver={handleDragOverWidget}
                    onDragLeave={handleDragLeaveWidget}
                    onDrop={handleDropWidget}
                >
                    {unscheduledTasks.map(t => {
                        const style = getPriorityStyle(t.priority);
                        return (
                            <div key={t.id} className={styles.unscheduledCard} draggable onDragStart={(e) => handleDragStart(e, t.id)}>
                                <div className={styles.unscheduledCardTitle}>{t.title}</div>
                                <div className={styles.unscheduledCardFooter}>
                                    <span className={styles.priorityBadge} style={{ color: style.color, backgroundColor: style.backgroundColor }}>
                                        {(t.priority || "medium").toUpperCase()}
                                    </span>
                                    <TaskAvatarStack assignees={t.assignees_info || []} size={16} />
                                </div>
                            </div>
                        );
                    })}
                    {unscheduledTasks.length === 0 && <div className={styles.allScheduledMsg}>All tasks scheduled!</div>}
                </div>
            </div>

            {/* Timeline Area (Right Viewport) */}
            <div className={styles.timelineArea}>
                <div className={styles.timelineHeaderRow}>
                    <div style={{ padding: "14px 20px", fontWeight: 700, fontSize: 12, color: "#8a7a6a", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }} />
                    {days.map(d => (
                        <div key={d} className={styles.timelineHeaderCell}>{d}</div>
                    ))}
                </div>

                <div className={styles.timelineScrollable}>
                    {visibleWeeks.map((wk) => (
                        <div key={wk.id} className={styles.timelineRow}>
                            <div className={styles.timelineWeekLabel}>
                                {wk.label.replace(" (", "\n(")}
                            </div>
                            {days.map((_, di) => {
                                const cellTasks = placedTasks[wk.id][di] || [];
                                const cellDateTs = wk.startTs + di * DAY_MS;

                                return (
                                    <div
                                        key={di}
                                        className={styles.timelineCell}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, cellDateTs)}
                                    >
                                        {cellTasks.map(t => (
                                            <TimelineCard
                                                key={t.id}
                                                task={t}
                                                members={members}
                                                assignees={t.assignees_info || []}
                                                onUpdate={onUpdate}
                                                onDragStart={handleDragStart}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className={styles.paginationArea}>
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            className={`${styles.pageDot} ${page === i ? styles.pageDotActive : ""}`}
                            onClick={() => setPage(i)}
                            aria-label={`Go to page ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function TimelineCard({ task, members, assignees, onUpdate, onDragStart }) {
    const [showPopup, setShowPopup] = useState(false);
    const triggerRef = useRef(null);
    const c = getPriorityStyle(task.priority);
    const toggleAssignee = buildToggleAssignee(assignees, task.id, onUpdate);

    return (
        <div
            className={styles.timelineCard}
            style={{
                background: c.bg,
                border: `1.5px solid ${c.border}`,
                position: showPopup ? "relative" : "static",
                zIndex: showPopup ? 50 : "auto"
            }}
            draggable
            onDragStart={(e) => {
                e.stopPropagation();
                onDragStart(e, task.id);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                setShowPopup(true);
            }}
        >
            <div className={styles.cardTitle}>{task.title}</div>
            <div className={styles.cardFooter}>
                <span className={styles.cardPriorityBadge} style={{ color: c.color, backgroundColor: c.backgroundColor }}>
                    {task.priority || "MEDIUM"}
                </span>
                <div
                    ref={triggerRef}
                    className={styles.avatarTrigger}
                    onClick={(e) => { e.stopPropagation(); setShowPopup(v => !v); }}
                >
                    <TaskAvatarStack assignees={assignees} size={16} max={2} />
                </div>
            </div>

            <TaskAssigneePopup
                isOpen={showPopup}
                onClose={() => setShowPopup(false)}
                members={members}
                assignees={assignees}
                onToggleAssignee={toggleAssignee}
                triggerRef={triggerRef}
            />
        </div>
    );
}
