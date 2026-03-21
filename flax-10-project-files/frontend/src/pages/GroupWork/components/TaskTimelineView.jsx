/*
 * GroupWork task timeline view.
 */

import { useMemo, useRef, useState } from "react";
import styles from "./TaskTimelineView.module.css";
import { getPriorityStyle } from "../utils/priorityUtils";
import { handleDragStartTask, buildToggleAssignee, filterVisibleAssignees } from "../utils/taskUtils";
import { 
    getTimelineAnchor, 
    buildWeeks, 
    placeTasksIntoWeeks, 
    DAY_MS 
} from "../utils/taskTimelineUtils";
import TaskAvatarStack from "./TaskAvatarStack";
import TaskAssigneePopup from "./TaskAssigneePopup";

// --- Logic helpers for TaskTimelineView ---

function useDragHandlers(onUpdate) {
    const onDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add(styles.timelineCellDropTarget); };
    const onDragLeave = (e) => { e.currentTarget.classList.remove(styles.timelineCellDropTarget); };
    const onDrop = (e, ts) => {
        e.preventDefault();
        e.currentTarget.classList.remove(styles.timelineCellDropTarget);
        const taskId = e.dataTransfer.getData("text/plain");
        const date = new Date(ts);
        date.setHours(12, 0, 0, 0);
        if (taskId) onUpdate(Number(taskId), { due_date: date.toISOString() });
    };
    const onDropWidget = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove(styles.widgetListDropTarget);
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) onUpdate(Number(taskId), { due_date: null });
    };
    return { onDragOver, onDragLeave, onDrop, onDropWidget };
}

function UnscheduledCard({ t, members }) {
    const style = getPriorityStyle(t.priority);
    return (
        <div className={styles.unscheduledCard} draggable onDragStart={(e) => handleDragStartTask(e, t.id)}>
            <div className={styles.unscheduledCardTitle}>{t.title}</div>
            <div className={styles.unscheduledCardFooter}>
                <span className={styles.priorityBadge} style={{ color: style.color, backgroundColor: style.backgroundColor }}>
                    {(t.priority || "medium").toUpperCase()}
                </span>
                <TaskAvatarStack assignees={filterVisibleAssignees(t.assignees_info || [], members)} size={16} />
            </div>
        </div>
    );
}

function UnscheduledWidget({ tasks, members, onDrop }) {
    const onOver = (e) => { e.preventDefault(); e.currentTarget.classList.add(styles.widgetListDropTarget); };
    const onLeave = (e) => { e.currentTarget.classList.remove(styles.widgetListDropTarget); };
    return (
        <div className={styles.unscheduledWidget}>
            <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>Unscheduled <span className={styles.widgetCount}>{tasks.length}</span></h3>
            </div>
            <div className={styles.widgetList} onDragOver={onOver} onDragLeave={onLeave} onDrop={onDrop}>
                {tasks.map(t => <UnscheduledCard key={t.id} t={t} members={members} />)}
                {tasks.length === 0 && <div className={styles.allScheduledMsg}>All tasks scheduled!</div>}
            </div>
        </div>
    );
}

function TimelineHeader({ days }) {
    return (
        <div className={styles.timelineHeaderRow}>
            <div style={{ padding: "14px 20px" }} />
            {days.map(d => <div key={d} className={styles.timelineHeaderCell}>{d}</div>)}
        </div>
    );
}

function TimelineCell({ wk, di, tasks, members, onUpdate, handlers }) {
    const ts = wk.startTs + di * DAY_MS;
    return (
        <div className={styles.timelineCell} onDragOver={handlers.onDragOver} onDragLeave={handlers.onDragLeave} onDrop={(e) => handlers.onDrop(e, ts)}>
            {tasks.map(t => (
                <TimelineCard
                key={t.id}
                task={t}
                members={members}
                assignees={filterVisibleAssignees(t.assignees_info || [], members)}
                onUpdate={onUpdate}
                onDragStart={handleDragStartTask}
              />
            ))}
        </div>
    );
}

function Pagination({ total, current, onChange }) {
    return (
        <div className={styles.paginationArea}>
            {Array.from({ length: total }).map((_, i) => (
                <button key={i} className={`${styles.pageDot} ${current === i ? styles.pageDotActive : ""}`} onClick={() => onChange(i)} />
            ))}
        </div>
    );
}

function TimelineGrid({ visible, days, placed, members, onUpdate, handlers }) {
    return (
        <div className={styles.timelineScrollable}>
            {visible.map(wk => (
                <div key={wk.id} className={styles.timelineRow}>
                    <div className={styles.timelineWeekLabel}>{wk.label.replace(" (", "\n(")}</div>
                    {days.map((_, di) => <TimelineCell key={di} wk={wk} di={di} tasks={placed[wk.id][di] || []} members={members} onUpdate={onUpdate} handlers={handlers} />)}
                </div>
            ))}
        </div>
    );
}

function useTimelineState(tasks, anchor, page) {
    const weeks = useMemo(() => buildWeeks(anchor), [anchor]);
    const placed = useMemo(() => placeTasksIntoWeeks(tasks, weeks), [tasks, weeks]);
    const unscheduled = useMemo(() => tasks.filter(t => !t.due_date && !t.completed && t.status !== "done"), [tasks]);
    const visible = weeks.slice(page * 3, (page + 1) * 3);
    return { weeks, placed, unscheduled, visible };
}

export default function TaskTimelineView({ tasks, members, onUpdate }) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const anchor = useMemo(() => getTimelineAnchor(), []);
    const [page, setPage] = useState(0);
    const { weeks, placed, unscheduled, visible } = useTimelineState(tasks, anchor, page);
    const handlers = useDragHandlers(onUpdate);

    return (
        <div className={styles.viewContainer}>
            <UnscheduledWidget tasks={unscheduled} members={members} onDrop={handlers.onDropWidget} />
            <div className={styles.timelineArea}>
                <TimelineHeader days={days} />
                <TimelineGrid visible={visible} days={days} placed={placed} members={members} onUpdate={onUpdate} handlers={handlers} />
                <Pagination total={Math.ceil(weeks.length / 3)} current={page} onChange={setPage} />
            </div>
        </div>
    );
}

function TimelineCard({ task, members, assignees, onUpdate }) {
    const [showPopup, setShowPopup] = useState(false);
    const triggerRef = useRef(null);
    const c = getPriorityStyle(task.priority);
    const toggle = buildToggleAssignee(assignees, task.id, onUpdate);
    const cardStyle = { background: c.bg, border: `1.5px solid ${c.border}`, position: showPopup ? "relative" : "static", zIndex: showPopup ? 50 : "auto" };

    return (
        <div className={styles.timelineCard} style={{ ...cardStyle, opacity: task.completed ? 0.6 : 1 }} draggable onDragStart={(e) => { e.stopPropagation(); handleDragStartTask(e, task.id); }} onContextMenu={(e) => { e.preventDefault(); setShowPopup(true); }}>
            <div className={styles.cardTitle} style={{ color: c.text }}>{task.title}</div>
            <div className={styles.cardFooter}>
                <span className={styles.cardPriorityBadge} style={{ color: c.color, backgroundColor: c.backgroundColor }}>{task.priority || "MEDIUM"}</span>
                <div ref={triggerRef} className={styles.avatarTrigger} onClick={(e) => { e.stopPropagation(); setShowPopup(v => !v); }}><TaskAvatarStack assignees={assignees} size={16} max={2} /></div>
            </div>
            <TaskAssigneePopup isOpen={showPopup} onClose={() => setShowPopup(false)} members={members} assignees={assignees} onToggleAssignee={toggle} triggerRef={triggerRef} />
        </div>
    );
}
