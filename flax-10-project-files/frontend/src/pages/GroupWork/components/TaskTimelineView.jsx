/*
 * GroupWork task timeline view.
 */

import { useMemo, useRef, useState } from "react";
import styles from "./TaskTimelineView.module.css";
import { getPriorityStyle } from "../utils/priorityUtils";
import { DAY_MS, buildWeeks, getTimelineAnchor, placeTasksIntoWeeks } from "../utils/taskTimelineUtils";
import { buildToggleAssignee, filterVisibleAssignees, handleDragStartTask, saveTaskTitle, startTaskEdit } from "../utils/taskUtils";
import TaskAssigneePopup from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import TaskContextMenu from "./TaskContextMenu";

function dropTaskAtTimestamp(event, onUpdate, ts) {
    event.preventDefault();
    event.currentTarget.classList.remove(styles.timelineCellDropTarget);
    const taskId = event.dataTransfer.getData("text/plain");
    const date = new Date(ts);
    date.setHours(12, 0, 0, 0);
    if (taskId) onUpdate(Number(taskId), { due_date: date.toISOString() });
}

function dropTaskToBacklog(event, onUpdate) {
    event.preventDefault();
    event.currentTarget.classList.remove(styles.widgetListDropTarget);
    const taskId = event.dataTransfer.getData("text/plain");
    if (taskId) onUpdate(Number(taskId), { due_date: null });
}

function useDragHandlers(onUpdate) {
    const onDragOver = (event) => { event.preventDefault(); event.currentTarget.classList.add(styles.timelineCellDropTarget); };
    const onDragLeave = (event) => { event.currentTarget.classList.remove(styles.timelineCellDropTarget); };
    return {
        onDragOver,
        onDragLeave,
        onDrop: (event, ts) => dropTaskAtTimestamp(event, onUpdate, ts),
        onDropWidget: (event) => dropTaskToBacklog(event, onUpdate),
    };
}

function handleInlineEditKeyDown(event, onSave, onCancel) {
    if (event.key === "Enter") onSave();
    if (event.key === "Escape") onCancel();
}

function InlineEditInput({ className, onCancel, onChange, onSave, value }) {
    return <input autoFocus className={className} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onSave} onKeyDown={(event) => handleInlineEditKeyDown(event, onSave, onCancel)} />;
}

function UnscheduledCardFooter({ members, style, task }) {
    return (
        <div className={styles.unscheduledCardFooter}>
            <span className={styles.priorityBadge} style={{ color: style.color, backgroundColor: style.backgroundColor }}>{(task.priority || "medium").toUpperCase()}</span>
            <TaskAvatarStack assignees={filterVisibleAssignees(task.assignees_info || [], members)} size={16} />
        </div>
    );
}

function UnscheduledCardContent({ editing, editTitle, members, saveEdit, setEditTitle, setEditing, style, task }) {
    return (
        <div className={styles.unscheduledCard} draggable onDragStart={(event) => handleDragStartTask(event, task.id)}>
            {editing ? <InlineEditInput value={editTitle} onChange={setEditTitle} onSave={saveEdit} onCancel={() => setEditing(false)} className={styles.unscheduledCardInput} /> : <div className={styles.unscheduledCardTitle}>{task.title}</div>}
            <UnscheduledCardFooter members={members} style={style} task={task} />
        </div>
    );
}

function UnscheduledCard({ members, onDelete, onUpdate, task }) {
    const style = getPriorityStyle(task.priority);
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [ctxMenu, setCtxMenu] = useState(null);
    const saveEdit = () => saveTaskTitle(editTitle, setEditing, task, onUpdate);
    const handleEditStart = () => startTaskEdit(setEditing, setEditTitle, task.title);

    return (
        <>
            <div onContextMenu={(event) => { event.preventDefault(); setCtxMenu({ x: event.clientX, y: event.clientY }); }}>
                <UnscheduledCardContent task={task} editing={editing} editTitle={editTitle} members={members} saveEdit={saveEdit} setEditTitle={setEditTitle} setEditing={setEditing} style={style} />
            </div>
            {ctxMenu ? <TaskContextMenu pos={ctxMenu} task={task} onDelete={onDelete} onClose={() => setCtxMenu(null)} onEditStart={handleEditStart} /> : null}
        </>
    );
}

function UnscheduledWidget({ members, onDelete, onDrop, onUpdate, tasks }) {
    const onOver = (event) => { event.preventDefault(); event.currentTarget.classList.add(styles.widgetListDropTarget); };
    const onLeave = (event) => { event.currentTarget.classList.remove(styles.widgetListDropTarget); };

    return (
        <div className={styles.unscheduledWidget}>
            <div className={styles.widgetHeader}>
                <h3 className={styles.widgetTitle}>Unscheduled <span className={styles.widgetCount}>{tasks.length}</span></h3>
                <span className={styles.rightClickTip}>✦ Right click to edit or delete</span>
            </div>
            <div className={styles.widgetList} onDragOver={onOver} onDragLeave={onLeave} onDrop={onDrop}>
                {tasks.map((task) => <UnscheduledCard key={task.id} task={task} members={members} onDelete={onDelete} onUpdate={onUpdate} />)}
                {tasks.length === 0 ? <div className={styles.allScheduledMsg}>All tasks scheduled!</div> : null}
            </div>
        </div>
    );
}

function TimelineHeader({ days }) {
    return (
        <div className={styles.timelineHeaderRow}>
            <div style={{ padding: "14px 20px" }} />
            {days.map((day) => <div key={day} className={styles.timelineHeaderCell}>{day}</div>)}
        </div>
    );
}

function TimelineCell({ dayIndex, handlers, members, onDelete, onUpdate, tasks, week }) {
    const ts = week.startTs + dayIndex * DAY_MS;
    return (
        <div className={styles.timelineCell} onDragOver={handlers.onDragOver} onDragLeave={handlers.onDragLeave} onDrop={(event) => handlers.onDrop(event, ts)}>
            {tasks.map((task) => <TimelineCard key={task.id} task={task} members={members} assignees={filterVisibleAssignees(task.assignees_info || [], members)} onUpdate={onUpdate} onDelete={onDelete} />)}
        </div>
    );
}

function Pagination({ current, onChange, total }) {
    return (
        <div className={styles.paginationArea}>
            {Array.from({ length: total }).map((_, index) => <button key={index} className={`${styles.pageDot} ${current === index ? styles.pageDotActive : ""}`} onClick={() => onChange(index)} />)}
        </div>
    );
}

function WeekLabel({ label }) {
    const match = label.match(/^(Week \d+)\s*(\(.*\))?/);
    if (!match) return <div className={styles.timelineWeekLabel}>{label}</div>;
    return (
        <div className={styles.timelineWeekLabel}>
            <span className={styles.weekNum}>{match[1]}</span>
            {match[2] ? <span className={styles.weekRange}>{match[2]}</span> : null}
        </div>
    );
}

function TimelineGrid({ days, handlers, members, onDelete, onUpdate, placed, visible }) {
    return (
        <div className={styles.timelineScrollable}>
            {visible.map((week) => (
                <div key={week.id} className={styles.timelineRow}>
                    <WeekLabel label={week.label} />
                    {days.map((_, dayIndex) => <TimelineCell key={dayIndex} week={week} dayIndex={dayIndex} tasks={placed[week.id][dayIndex] || []} members={members} onUpdate={onUpdate} onDelete={onDelete} handlers={handlers} />)}
                </div>
            ))}
        </div>
    );
}

function useTimelineState(tasks, anchor, page) {
    const weeks = useMemo(() => buildWeeks(anchor), [anchor]);
    const placed = useMemo(() => placeTasksIntoWeeks(tasks, weeks), [tasks, weeks]);
    const unscheduled = useMemo(() => tasks.filter((task) => !task.due_date && !task.completed && task.status !== "done"), [tasks]);
    const visible = weeks.slice(page * 3, (page + 1) * 3);
    return { weeks, placed, unscheduled, visible };
}

function TimelineCardBody({ assignees, colour, editing, editTitle, members, saveEdit, setEditTitle, setEditing, setShowPopup, showPopup, task, toggle, triggerRef }) {
    return (
        <div className={styles.timelineCard} style={{ background: colour.bg, border: `1.5px solid ${colour.border}`, position: showPopup ? "relative" : "static", zIndex: showPopup ? 50 : "auto", opacity: task.completed ? 0.6 : 1 }}>
            {editing ? <InlineEditInput value={editTitle} onChange={setEditTitle} onSave={saveEdit} onCancel={() => setEditing(false)} className={styles.timelineCardInput} /> : <div className={styles.cardTitle} style={{ color: colour.text }}>{task.title}</div>}
            <div className={styles.cardFooter}>
                <span className={styles.cardPriorityBadge} style={{ color: colour.color, backgroundColor: colour.backgroundColor }}>{task.priority || "MEDIUM"}</span>
                <div ref={triggerRef} className={styles.avatarTrigger} onClick={(event) => { event.stopPropagation(); setShowPopup((value) => !value); }}>
                    <TaskAvatarStack assignees={assignees} size={16} max={2} />
                </div>
            </div>
            <TaskAssigneePopup isOpen={showPopup} onClose={() => setShowPopup(false)} members={members} assignees={assignees} onToggleAssignee={toggle} triggerRef={triggerRef} />
        </div>
    );
}

function TimelineCard({ assignees, members, onDelete, onUpdate, task }) {
    const [showPopup, setShowPopup] = useState(false);
    const [ctxMenu, setCtxMenu] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const triggerRef = useRef(null);
    const colour = getPriorityStyle(task.priority);
    const toggle = buildToggleAssignee(assignees, task.id, onUpdate);
    const saveEdit = () => saveTaskTitle(editTitle, setEditing, task, onUpdate);
    const handleEditStart = () => startTaskEdit(setEditing, setEditTitle, task.title);

    return (
        <>
            <div draggable onDragStart={(event) => { event.stopPropagation(); handleDragStartTask(event, task.id); }} onContextMenu={(event) => { event.preventDefault(); setCtxMenu({ x: event.clientX, y: event.clientY }); }}>
                <TimelineCardBody task={task} assignees={assignees} colour={colour} editing={editing} editTitle={editTitle} members={members} saveEdit={saveEdit} setEditTitle={setEditTitle} setEditing={setEditing} setShowPopup={setShowPopup} showPopup={showPopup} toggle={toggle} triggerRef={triggerRef} />
            </div>
            {ctxMenu ? <TaskContextMenu pos={ctxMenu} task={task} onDelete={onDelete} onClose={() => setCtxMenu(null)} onEditStart={handleEditStart} /> : null}
        </>
    );
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
