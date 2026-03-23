/*
 * GroupWork task board card.
 */

import { useRef, useState } from "react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import TaskAssigneePopup from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import TaskContextMenu from "./TaskContextMenu";
import { getPriorityStyle } from "../utils/priorityUtils";
import { buildToggleAssignee, filterVisibleAssignees, getDueDateStr } from "../utils/taskUtils";
import styles from "./TaskBoardCard.module.css";

function useBoardCardEdit(task, onUpdate) {
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const saveEdit = () => {
        const trimmed = editTitle.trim();
        if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed });
        setEditing(false);
    };
    return { editing, setEditing, editTitle, setEditTitle, saveEdit };
}

function handleCardKeyDown(e, saveEdit, setEditing) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
    if (e.key === "Escape") setEditing(false);
}

function CardTitleArea({ editing, editTitle, setEditTitle, saveEdit, setEditing, title }) {
    if (editing) {
        return (
            <textarea autoFocus className={styles.cardTitleInput} value={editTitle} rows={2}
                onChange={(e) => setEditTitle(e.target.value)} onBlur={saveEdit}
                onKeyDown={(e) => handleCardKeyDown(e, saveEdit, setEditing)} />
        );
    }
    return <div className={styles.cardTitle}>{title}</div>;
}

function CardHeader({ task, priorityStyle, onUpdate }) {
    const psVars = { '--ps-bg': priorityStyle.backgroundColor, '--ps-text': priorityStyle.color };
    return (
        <div className={styles.cardHeader}>
            <select value={(task.priority || "medium").toLowerCase()} onChange={(event) => onUpdate(task.id, { priority: event.target.value })} className={`${styles.prioritySelect} ${styles.prioritySelectColored}`} style={psVars}>
                <option value="urgent">URGENT</option>
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
            </select>
        </div>
    );
}

function CardFooter({ task, assignees, onUpdate, triggerRef, togglePopup }) {
    return (
        <div className={styles.cardFooter}>
            <div className={styles.cardDate}>
                <DateTimePicker value={getDueDateStr(task.due_date)} onChange={(value) => onUpdate(task.id, { due_date: value ? new Date(value).toISOString() : null })} dateOnly triggerClassName={styles.dateLabelInteractive} hideIcon placeholder="No due date" />
            </div>
            <div ref={triggerRef} onClick={togglePopup} className={styles.assigneeFooterBtn}>
                <TaskAvatarStack assignees={assignees} size={18} />
                <span className={styles.addAssigneeBtn}>+</span>
            </div>
        </div>
    );
}

export default function TaskBoardCard({ task, members, onUpdate, onDelete, onDragStart }) {
    const [showAssignPopup, setShowAssignPopup] = useState(false);
    const [ctxMenu, setCtxMenu] = useState(null);
    const { editing, setEditing, editTitle, setEditTitle, saveEdit } = useBoardCardEdit(task, onUpdate);
    const triggerRef = useRef(null);
    const assignees = filterVisibleAssignees(task.assignees_info || [], members);
    const priorityStyle = getPriorityStyle(task.priority);
    const handleContextMenu = (e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); };
    return (
        <>
            <div className={getCardClassName(task, showAssignPopup)} draggable onDragStart={(e) => onDragStart(e, task.id)} onContextMenu={handleContextMenu}>
                <CardHeader task={task} priorityStyle={priorityStyle} onUpdate={onUpdate} />
                <CardTitleArea editing={editing} editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} setEditing={setEditing} title={task.title} />
                <CardFooter task={task} assignees={assignees} onUpdate={onUpdate} triggerRef={triggerRef} togglePopup={(e) => togglePopup(e, setShowAssignPopup)} />
                <TaskAssigneePopup isOpen={showAssignPopup} onClose={() => setShowAssignPopup(false)} members={members} assignees={assignees} onToggleAssignee={buildToggleAssignee(assignees, task.id, onUpdate)} triggerRef={triggerRef} />
            </div>
            {ctxMenu && <TaskContextMenu pos={ctxMenu} task={task} onDelete={onDelete} onClose={() => setCtxMenu(null)} onEditStart={() => { setEditing(true); setEditTitle(task.title); }} />}
        </>
    );
}

function getCardClassName(task, showAssignPopup) {
    return `${styles.boardCard} ${task.status === "done" || task.completed ? styles.boardCardDone : ""} ${showAssignPopup ? styles.boardCardActive : ""}`;
}

function togglePopup(event, setShowAssignPopup) {
    event.stopPropagation();
    setShowAssignPopup((value) => !value);
}
