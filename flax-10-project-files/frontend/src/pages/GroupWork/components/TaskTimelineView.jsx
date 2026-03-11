import React, { useMemo, useState, useRef } from "react";
import TaskAssigneePopup, { getUserColor } from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
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

export default function TaskTimelineView({ tasks, members, onUpdate }) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const anchorMonday = useMemo(() => getTimelineAnchor(), []);
    const [page, setPage] = useState(0);
    const WEEKS_PER_PAGE = 3;

    // Generate 8 weeks starting from anchorMonday to allow scrolling into the future
    const weeks = useMemo(() => {
        return Array.from({ length: 8 }).map((_, offset) => {
            const start = new Date(anchorMonday.getTime() + offset * WEEK_MS);
            const end = new Date(start.getTime() + 5 * DAY_MS); // Saturday

            const startStr = start.toLocaleString('en-US', { month: 'short', day: 'numeric' });
            const endStr = end.toLocaleString('en-US', { month: 'short', day: 'numeric' });

            return {
                id: offset,
                label: `Week ${offset + 1} (${startStr}–${endStr})`,
                startTs: start.getTime(),
                endTs: end.getTime() + DAY_MS // Up to Sunday start
            };
        });
    }, [anchorMonday]);

    const colors = {
        urgent: { bg: "#f9a8c9", border: "#f9a8c9", text: "#9b2257" },
        high: { bg: "#fcd5a8", border: "#fcd5a8", text: "#9b5a22" },
        medium: { bg: "#f5e6a3", border: "#f5e6a3", text: "#7a6a1a" },
        low: { bg: "#b8e8c8", border: "#b8e8c8", text: "#1a6a3a" },
    };

    // Calculate dynamic weeks from the current tasks
    const placedTasks = useMemo(() => {
        // Initialize an empty layout for however many weeks we have
        const layout = Array.from({ length: weeks.length }, () => [[], [], [], [], [], []]);

        tasks.forEach(t => {
            if (!t.due_date || t.completed || t.status === "done") return; // exclude completed from main grid
            const ts = new Date(t.due_date).getTime();

            // Find which week it falls in
            let weekIdx = -1;
            for (let i = 0; i < weeks.length; i++) {
                if (ts >= weeks[i].startTs && ts < weeks[i].endTs) {
                    weekIdx = i;
                    break;
                }
            }

            if (weekIdx !== -1) {
                const dayOfWeek = (new Date(ts).getDay() + 6) % 7; // Monday = 0
                if (dayOfWeek < 6) { // Mon-Sat only
                    layout[weekIdx][dayOfWeek].push(t);
                }
            }
        });
        return layout;
    }, [tasks, weeks]);

    // Filter tasks for the unscheduled widget
    const unscheduledTasks = useMemo(() => {
        return tasks.filter(t => !t.due_date && !t.completed && t.status !== "done");
    }, [tasks]);

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
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 220px)" }}>
            <div className={styles.viewContainer} style={{ height: "auto", flex: 1 }}>
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
                            const c = colors[(t.priority || "medium").toLowerCase()] || colors.medium;
                            return (
                                <div
                                    key={t.id}
                                    className={styles.unscheduledCard}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, t.id)}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8, lineHeight: 1.3 }}>{t.title}</div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 9, fontWeight: 800, color: c.text, textTransform: "uppercase", background: c.bg, padding: "3px 6px", borderRadius: 4 }}>{t.priority || "MEDIUM"}</span>
                                        <TaskAvatarStack assignees={t.assignees_info || []} size={16} />
                                    </div>
                                </div>
                            );
                        })}
                        {unscheduledTasks.length === 0 && (
                            <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13, padding: "24px 0", fontWeight: 500 }}>All tasks scheduled!</div>
                        )}
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
                                                    colors={colors}
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
        </div>
    );
}

function TimelineCard({ task, colors, members, assignees, onUpdate, onDragStart }) {
    const [showPopup, setShowPopup] = useState(false);
    const triggerRef = useRef(null);
    const c = colors[(task.priority || "medium").toLowerCase()] || colors.medium;

    const toggleAssignee = (userId) => {
        let currentIds = assignees.map(a => a.id);
        if (currentIds.includes(userId)) {
            currentIds = currentIds.filter(id => id !== userId);
        } else {
            currentIds.push(userId);
        }
        onUpdate(task.id, { assigned_to: currentIds });
    };

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
            <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 4, lineHeight: 1.3 }}>{task.title}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: c.text, textTransform: "uppercase" }}>{task.priority || "MEDIUM"}</span>
                <div
                    ref={triggerRef}
                    style={{ cursor: "pointer" }}
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
