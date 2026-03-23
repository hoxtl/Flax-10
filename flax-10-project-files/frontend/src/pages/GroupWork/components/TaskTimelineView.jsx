/*
 * GroupWork task timeline view.
 */

import { useMemo, useRef, useState } from "react";
import styles from "./TaskTimelineView.module.css";
import cardStyles from "./TaskTimelineCard.module.css";
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
import TaskContextMenu from "./TaskContextMenu";
import { useTaskTitleEdit } from "./taskCardEditUtils";

function CardEditInput({ editTitle, setEditTitle, saveEdit, setEditing, inputClassName }) {
    return (
        <input
            autoFocus
            className={inputClassName}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
        />
    );
}

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

function UnscheduledCardContent({ t, members, editing, editTitle, setEditTitle, saveEdit, setEditing }) {
    const style = getPriorityStyle(t.priority);
    const pbVars = { '--pb-color': style.color, '--pb-bg': style.backgroundColor };
    return (
        <>
            {editing ? (
                <CardEditInput editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} setEditing={setEditing} inputClassName={styles.unscheduledCardInput} />
            ) : (
                <div className={styles.unscheduledCardTitle}>{t.title}</div>
            )}
            <div className={styles.unscheduledCardFooter}>
                <span className={`${styles.priorityBadge} ${styles.priorityBadgeColored}`} style={pbVars}>{(t.priority || "medium").toUpperCase()}</span>
                <TaskAvatarStack assignees={filterVisibleAssignees(t.assignees_info || [], members)} size={16} />
            </div>
        </>
    );
}

function UnscheduledCard({ t, members, onDelete, onUpdate }) {
    const [ctxMenu, setCtxMenu] = useState(null);
    const { editing, editTitle, setEditTitle, setEditing, saveEdit } = useTaskTitleEdit(t, onUpdate);
    const handleContextMenu = (e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); };
    return (
        <>
            <div className={styles.unscheduledCard} draggable onDragStart={(e) => handleDragStartTask(e, t.id)} onContextMenu={handleContextMenu}>
                <UnscheduledCardContent t={t} members={members} editing={editing} editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} setEditing={setEditing} />
            </div>
            {ctxMenu && <TaskContextMenu pos={ctxMenu} task={t} onDelete={onDelete} onClose={() => setCtxMenu(null)} onEditStart={() => setEditing(true)} />}
        </>
    );
}

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
                {tasks.map(t => <UnscheduledCard key={t.id} t={t} members={members} onDelete={onDelete} onUpdate={onUpdate} />)}
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
    const ts = wk.startTs + di * DAY_MS;
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

function useTimelineState(tasks, anchor, page) {
    const weeks = useMemo(() => buildWeeks(anchor), [anchor]);
    const placed = useMemo(() => placeTasksIntoWeeks(tasks, weeks), [tasks, weeks]);
    const unscheduled = useMemo(() => tasks.filter(t => !t.due_date && !t.completed && t.status !== "done"), [tasks]);
    const visible = weeks.slice(page * 3, (page + 1) * 3);
    return { weeks, placed, unscheduled, visible };
}

export default function TaskTimelineView({ tasks, members, onUpdate, onDelete }) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const anchor = useMemo(() => getTimelineAnchor(), []);
    const [page, setPage] = useState(0);
    const { weeks, placed, unscheduled, visible } = useTimelineState(tasks, anchor, page);
    const handlers = useDragHandlers(onUpdate);

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

function CardTitleOrEdit({ editing, editTitle, setEditTitle, saveEdit, setEditing, c, task }) {
    if (editing) return <CardEditInput editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} setEditing={setEditing} inputClassName={cardStyles.timelineCardInput} />;
    return <div className={cardStyles.cardTitle} style={{ color: c.text }}>{task.title}</div>;
}

function TimelineCardBody({ task, editing, editTitle, setEditTitle, setEditing, saveEdit, c, showPopup, setShowPopup, members, assignees, toggle, cardStyle }) {
    const triggerRef = useRef(null);
    const fullCardStyle = Object.assign({}, cardStyle, { opacity: task.completed ? 0.6 : 1 });
    const pbVars = { '--pb-color': c.color, '--pb-bg': c.backgroundColor };
    return (
        <div className={cardStyles.timelineCard} style={fullCardStyle}>
            <CardTitleOrEdit editing={editing} editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} setEditing={setEditing} c={c} task={task} />
            <div className={cardStyles.cardFooter}>
                <span className={`${cardStyles.cardPriorityBadge} ${cardStyles.cardPriorityBadgeColored}`} style={pbVars}>{task.priority || "MEDIUM"}</span>
                <div ref={triggerRef} className={cardStyles.avatarTrigger} onClick={(e) => { e.stopPropagation(); setShowPopup(v => !v); }}><TaskAvatarStack assignees={assignees} size={16} max={2} /></div>
            </div>
            <TaskAssigneePopup isOpen={showPopup} onClose={() => setShowPopup(false)} members={members} assignees={assignees} onToggleAssignee={toggle} triggerRef={triggerRef} />
        </div>
    );
}

function buildTimelineCardStyle(c, showPopup) {
    return { background: c.bg, border: `1.5px solid ${c.border}`, position: showPopup ? "relative" : "static", zIndex: showPopup ? 50 : "auto" };
}

function TimelineCard({ task, members, assignees, onUpdate, onDelete }) {
    const [showPopup, setShowPopup] = useState(false);
    const [ctxMenu, setCtxMenu] = useState(null);
    const { editing, editTitle, setEditTitle, setEditing, saveEdit } = useTaskTitleEdit(task, onUpdate);
    const c = getPriorityStyle(task.priority);
    const toggle = buildToggleAssignee(assignees, task.id, onUpdate);
    const handleContextMenu = (e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); };
    return (
        <>
            <div draggable onDragStart={(e) => { e.stopPropagation(); handleDragStartTask(e, task.id); }} onContextMenu={handleContextMenu}>
                <TimelineCardBody task={task} editing={editing} editTitle={editTitle} setEditTitle={setEditTitle} setEditing={setEditing} saveEdit={saveEdit} c={c} showPopup={showPopup} setShowPopup={setShowPopup} members={members} assignees={assignees} toggle={toggle} cardStyle={buildTimelineCardStyle(c, showPopup)} />
            </div>
            {ctxMenu && <TaskContextMenu pos={ctxMenu} task={task} onDelete={onDelete} onClose={() => setCtxMenu(null)} onEditStart={() => setEditing(true)} />}
        </>
    );
}
