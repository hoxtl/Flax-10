/*
 * GroupWork task timeline view.
 */

import { useState } from "react";
import styles from "./TaskTimelineView.module.css";
import { filterVisibleAssignees } from "../utils/taskUtils";
import { TimelineCard, UnscheduledCard } from "./TaskTimelineCards";
import { useDragHandlers, useTaskTimelineState } from "./useTaskTimelineState";

function UnscheduledWidget({ tasks, members, onDrop, onDelete, onUpdate }) {
    const onOver = (e) => { e.preventDefault(); e.currentTarget.classList.add(styles.widgetListDropTarget); };
    const onLeave = (e) => { e.currentTarget.classList.remove(styles.widgetListDropTarget); };
    return (
        <div className={styles.unscheduledWidget}>
            <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>Unscheduled <span className={styles.widgetCount}>{tasks.length}</span></h3>
                <span className={styles.rightClickTip}>✦ Right click to edit or delete</span>
            </div>
            <div className={styles.widgetList} onDragOver={onOver} onDragLeave={onLeave} onDrop={onDrop}>
                {tasks.map((task) => <UnscheduledCard key={task.id} task={task} members={members} onDelete={onDelete} onUpdate={onUpdate} />)}
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

function TimelineCell({ wk, di, tasks, members, onUpdate, onDelete, handlers }) {
    const ts = wk.startTs + di * handlers.dayMs;
    return (
        <div className={styles.timelineCell} onDragOver={handlers.onDragOver} onDragLeave={handlers.onDragLeave} onDrop={(e) => handlers.onDrop(e, ts)}>
            {tasks.map(t => (
                <TimelineCard key={t.id} task={t} members={members}
                    assignees={filterVisibleAssignees(t.assignees_info || [], members)}
                    onUpdate={onUpdate} onDelete={onDelete} onDragStart={handleDragStartTask} />
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

function WeekLabel({ label }) {
    const match = label.match(/^(Week \d+)\s*(\(.*\))?/);
    if (!match) return <div className={styles.timelineWeekLabel}>{label}</div>;
    return (
        <div className={styles.timelineWeekLabel}>
            <span className={styles.weekNum}>{match[1]}</span>
            {match[2] && <span className={styles.weekRange}>{match[2]}</span>}
        </div>
    );
}

function TimelineGrid({ visible, days, placed, members, onUpdate, onDelete, handlers }) {
    return (
        <div className={styles.timelineScrollable}>
            {visible.map(wk => (
                <div key={wk.id} className={styles.timelineRow}>
                    <WeekLabel label={wk.label} />
                    {days.map((_, di) => <TimelineCell key={di} wk={wk} di={di} tasks={placed[wk.id][di] || []} members={members} onUpdate={onUpdate} onDelete={onDelete} handlers={handlers} />)}
                </div>
            ))}
        </div>
    );
}

export default function TaskTimelineView({ tasks, members, onUpdate, onDelete }) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const [page, setPage] = useState(0);
    const { weeks, placed, unscheduled, visible, dayMs } = useTaskTimelineState(tasks, page);
    const handlers = { ...useDragHandlers(onUpdate, styles), dayMs };

    return (
        <div className={styles.viewContainer}>
            <UnscheduledWidget tasks={unscheduled} members={members} onDrop={handlers.onDropWidget} onDelete={onDelete} onUpdate={onUpdate} />
            <div className={styles.timelineArea}>
                <TimelineHeader days={days} />
                <TimelineGrid visible={visible} days={days} placed={placed} members={members} onUpdate={onUpdate} onDelete={onDelete} handlers={handlers} />
                <Pagination total={Math.ceil(weeks.length / 3)} current={page} onChange={setPage} />
            </div>
        </div>
    );
}
