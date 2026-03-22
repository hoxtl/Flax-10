/*
 * GroupWork task board card.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2 } from "lucide-react";
import DateTimePicker from "../../../components/Common/inputs/DateTimePicker";
import ctxStyles from "../../Tasks/components/TaskCardContextMenu.module.css";
import { getPriorityStyle } from "../utils/priorityUtils";
import { buildToggleAssignee, filterVisibleAssignees, getDueDateStr } from "../utils/taskUtils";
import TaskAssigneePopup from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import styles from "./TaskBoardView.module.css";

function useContextMenuClose(onClose) {
    useEffect(() => {
        document.addEventListener("mousedown", onClose);
        return () => document.removeEventListener("mousedown", onClose);
    }, [onClose]);
}

function BoardContextMenu({ onClose, onDelete, onEditStart, pos, task }) {
    useContextMenuClose(onClose);
    return createPortal(
        <div className={ctxStyles.ctxMenu} style={{ position: "fixed", top: pos.y, left: pos.x, zIndex: 10000 }} onMouseDown={(event) => event.stopPropagation()}>
            <button className={ctxStyles.ctxItem} onClick={() => { onClose(); onEditStart(); }}><Pencil size={14} strokeWidth={2} /> Edit</button>
            <div className={ctxStyles.ctxDivider} />
            <button className={`${ctxStyles.ctxItem} ${ctxStyles.ctxItemDanger}`} onClick={() => { onClose(); onDelete(task.id); }}><Trash2 size={14} strokeWidth={2} /> Delete</button>
        </div>,
        document.body
    );
}

function CardHeader({ onUpdate, priorityStyle, task }) {
    return (
        <div className={styles.cardHeader}>
            <select value={(task.priority || "medium").toLowerCase()} onChange={(event) => onUpdate(task.id, { priority: event.target.value })} className={styles.prioritySelect} style={{ backgroundColor: priorityStyle.backgroundColor, color: priorityStyle.color }}>
                <option value="urgent">URGENT</option>
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
            </select>
        </div>
    );
}

function CardFooter({ assignees, onUpdate, task, togglePopup, triggerRef }) {
    return (
        <div className={styles.cardFooter}>
            <div className={styles.cardDate}>
                <DateTimePicker value={getDueDateStr(task.due_date)} onChange={(value) => onUpdate(task.id, { due_date: value ? new Date(value).toISOString() : null })} dateOnly triggerClassName={styles.dateLabelInteractive} hideIcon placeholder="No due date" />
            </div>
            <div ref={triggerRef} onClick={togglePopup} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <TaskAvatarStack assignees={assignees} size={18} />
                <span className={styles.addAssigneeBtn}>+</span>
            </div>
        </div>
    );
}

function getCardClassName(task, showAssignPopup) {
    return `${styles.boardCard} ${task.status === "done" || task.completed ? styles.boardCardDone : ""} ${showAssignPopup ? styles.boardCardActive : ""}`;
}

function handleTitleKeyDown(event, onSave, onCancel) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSave(); }
    if (event.key === "Escape") onCancel();
}

function CardTitleArea({ editing, editTitle, onCancel, onSave, setEditTitle, title }) {
    if (!editing) return <div className={styles.cardTitle}>{title}</div>;
    return (
        <textarea
            autoFocus
            className={styles.cardTitleInput}
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            onBlur={onSave}
            onKeyDown={(event) => handleTitleKeyDown(event, onSave, onCancel)}
            rows={2}
        />
    );
}

function TaskBoardCardBody({ assignees, editing, editTitle, members, onDragStart, onUpdate, priorityStyle, saveEdit, setCtxMenu, setEditTitle, setEditing, setShowAssignPopup, showAssignPopup, task, triggerRef }) {
    return (
        <div className={getCardClassName(task, showAssignPopup)} draggable onDragStart={(event) => onDragStart(event, task.id)} onContextMenu={(event) => { event.preventDefault(); setCtxMenu({ x: event.clientX, y: event.clientY }); }}>
            <CardHeader task={task} priorityStyle={priorityStyle} onUpdate={onUpdate} />
            <CardTitleArea editing={editing} editTitle={editTitle} onSave={saveEdit} onCancel={() => setEditing(false)} setEditTitle={setEditTitle} title={task.title} />
            <CardFooter task={task} assignees={assignees} onUpdate={onUpdate} triggerRef={triggerRef} togglePopup={(event) => { event.stopPropagation(); setShowAssignPopup((value) => !value); }} />
            <TaskAssigneePopup isOpen={showAssignPopup} onClose={() => setShowAssignPopup(false)} members={members} assignees={assignees} onToggleAssignee={buildToggleAssignee(assignees, task.id, onUpdate)} triggerRef={triggerRef} />
        </div>
    );
}

function saveEditedTitle(editTitle, setEditing, task, onUpdate) {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed });
    setEditing(false);
}

function startEditing(setEditing, setEditTitle, title) {
    setEditing(true);
    setEditTitle(title);
}

export default function TaskBoardCard({ task, members, onUpdate, onDelete, onDragStart }) {
    const [showAssignPopup, setShowAssignPopup] = useState(false);
    const [ctxMenu, setCtxMenu] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const triggerRef = useRef(null);
    const assignees = filterVisibleAssignees(task.assignees_info || [], members);
    const priorityStyle = getPriorityStyle(task.priority);
    const saveEdit = () => saveEditedTitle(editTitle, setEditing, task, onUpdate);
    const handleEditStart = () => startEditing(setEditing, setEditTitle, task.title);

    return (
        <>
            <TaskBoardCardBody assignees={assignees} editing={editing} editTitle={editTitle} members={members} onDragStart={onDragStart} onUpdate={onUpdate} priorityStyle={priorityStyle} saveEdit={saveEdit} setCtxMenu={setCtxMenu} setEditTitle={setEditTitle} setEditing={setEditing} setShowAssignPopup={setShowAssignPopup} showAssignPopup={showAssignPopup} task={task} triggerRef={triggerRef} />
            {ctxMenu ? <BoardContextMenu pos={ctxMenu} task={task} onDelete={onDelete} onClose={() => setCtxMenu(null)} onEditStart={handleEditStart} /> : null}
        </>
    );
}
