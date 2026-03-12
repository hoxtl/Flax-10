import React, { useMemo, useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import DateTimePicker from "../../../components/common/inputs/DateTimePicker";
import TaskAssigneePopup from "./TaskAssigneePopup";
import TaskAvatarStack from "./TaskAvatarStack";
import { getPriorityStyle } from "../utils/priorityUtils";
import { buildToggleAssignee, getDueDateStr, handleDragStartTask } from "../utils/taskUtils";
import styles from "./TaskBoardView.module.css";

// --- Sub-components (Restored & Refactored) ---

function CardHeader({ t, pColor, onUpdate, onDelete }) {
    const onChange = (e) => onUpdate(t.id, { priority: e.target.value });
    return (
        <div className={styles.cardHeader}>
            <select value={(t.priority || "medium").toLowerCase()} onChange={onChange} className={styles.prioritySelect}
                style={{ backgroundColor: pColor.backgroundColor, color: pColor.color }}>
                <option value="urgent">URGENT</option><option value="high">HIGH</option>
                <option value="medium">MEDIUM</option><option value="low">LOW</option>
            </select>
            <button onClick={() => onDelete(t.id)} className={styles.iconBtnDelete}><Trash2 size={14} /></button>
        </div>
    );
}

function CardFooter({ t, assignees, onUpdate, triggerRef, togglePopup }) {
    const dateStr = getDueDateStr(t.due_date);
    const onDateChange = v => onUpdate(t.id, { due_date: v ? new Date(v).toISOString() : null });
    return (
        <div className={styles.cardFooter}>
            <div className={styles.cardDate}>
                <DateTimePicker value={dateStr} onChange={onDateChange} dateOnly triggerClassName={styles.dateLabelInteractive} hideIcon placeholder="No due date" />
            </div>
            <div ref={triggerRef} onClick={togglePopup} style={{ cursor: "pointer" }}><TaskAvatarStack assignees={assignees} size={20} /></div>
        </div>
    );
}

function BoardCard({ t, isDone, pColor, onUpdate, onDelete, members, handleDragStart }) {
    const [showAssignPopup, setShowAssignPopup] = useState(false);
    const triggerRef = useRef(null);
    const togglePopup = (e) => { e.stopPropagation(); setShowAssignPopup(v => !v); };
    const onCtxMenu = e => { e.preventDefault(); setShowAssignPopup(true); };
    const toggleAssignee = buildToggleAssignee(t.assignees_info || [], t.id, onUpdate);

    return (
        <div className={`${styles.boardCard} ${isDone ? styles.boardCardDone : ""} ${showAssignPopup ? styles.boardCardActive : ""}`}
            draggable onDragStart={(e) => handleDragStart(e, t.id)} onContextMenu={onCtxMenu}>
            <CardHeader t={t} pColor={pColor} onUpdate={onUpdate} onDelete={onDelete} />
            <div className={styles.cardTitle}>{t.title}</div>
            <CardFooter t={t} assignees={t.assignees_info || []} onUpdate={onUpdate} triggerRef={triggerRef} togglePopup={togglePopup} />
            <TaskAssigneePopup isOpen={showAssignPopup} onClose={() => setShowAssignPopup(false)} members={members}
                assignees={t.assignees_info || []} onToggleAssignee={toggleAssignee} triggerRef={triggerRef} />
        </div>
    );
}

function buildBoardColumns(tasks) {
    const todo = [], inProgress = [], done = [];
    tasks.forEach(t => {
        const stat = t.status || (t.completed ? "done" : "todo");
        if (stat === "done") done.push(t);
        else if (stat === "in_progress") inProgress.push(t);
        else todo.push(t);
    });
    return [
        { id: "todo", title: "To Do", tasks: todo, className: styles.colTodo, dotClass: styles.colTodoDot, textClass: styles.colTodoText },
        { id: "in_progress", title: "In Progress", tasks: inProgress, className: styles.colInProgress, dotClass: styles.colInProgressDot, textClass: styles.colInProgressText },
        { id: "done", title: "Done", tasks: done, className: styles.colDone, dotClass: styles.colDoneDot, textClass: styles.colDoneText }
    ];
}

function ColumnHeader({ col }) {
    return (
        <div className={styles.colHeader}>
            <div className={styles.colTitleWrapper}>
                <div className={`${styles.colDot} ${col.dotClass}`} />
                <h3 className={`${styles.colTitle} ${col.textClass}`}>{col.title}</h3>
            </div>
            <span className={styles.taskCount}>{col.tasks.length}</span>
        </div>
    );
}

function AddCardWidget({ colId, addingToCol, setAddingToCol, newCardTitle, setNewCardTitle, onSubmit, onKeyDown }) {
    if (addingToCol === colId) {
        return (
            <div className={styles.addCardInputWrapper}>
                <textarea autoFocus value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, colId)} onBlur={(e) => onSubmit(e, colId)}
                    className={styles.addCardInput} placeholder="Enter title..." rows={2} />
            </div>
        );
    }
    return <button className={styles.addCardBtn} onClick={() => setAddingToCol(colId)}>+ Add card</button>;
}

function BoardColumn({ col, members, onUpdate, onDelete, adding, actions }) {
    const onDrop = (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) onUpdate(Number(taskId), { status: col.id });
    };
    return (
        <div key={col.id} className={`${styles.column} ${col.className}`} onDragOver={e => e.preventDefault()} onDrop={onDrop}>
            <ColumnHeader col={col} />
            <div className={styles.cardList}>
                {col.tasks.map(t => <BoardCard key={t.id} t={t} isDone={t.status === "done" || t.completed} pColor={getPriorityStyle(t.priority)} onUpdate={onUpdate} onDelete={onDelete} members={members} handleDragStart={handleDragStartTask} />)}
                {col.tasks.length === 0 && !adding.addingToCol && <div className={styles.emptyCol}>No tasks</div>}
                <AddCardWidget colId={col.id} {...adding} {...actions} />
            </div>
        </div>
    );
}

function useBoardAdding(onAdd) {
    const [addingToCol, setAddingToCol] = useState(null);
    const [newCardTitle, setNewCardTitle] = useState("");
    const onSubmit = (e, colId) => { if (newCardTitle.trim()) onAdd(newCardTitle.trim(), colId); setAddingToCol(null); setNewCardTitle(""); };
    const onKeyDown = (e, colId) => {
        if (e.key === "Enter" && !e.shiftKey) onSubmit(e, colId);
        else if (e.key === "Escape") { setAddingToCol(null); setNewCardTitle(""); }
    };
    return { addingToCol, setAddingToCol, newCardTitle, setNewCardTitle, onSubmit, onKeyDown };
}

export default function TaskBoardView({ tasks, members, onUpdate, onDelete, onAdd }) {
    const columns = useMemo(() => buildBoardColumns(tasks), [tasks]);
    const add = useBoardAdding(onAdd);
    const addingProps = { addingToCol: add.addingToCol, setAddingToCol: add.setAddingToCol, newCardTitle: add.newCardTitle, setNewCardTitle: add.setNewCardTitle };
    const actionProps = { onSubmit: add.onSubmit, onKeyDown: add.onKeyDown };

    return (
        <div className={styles.boardContainer}>
            {columns.map(col => <BoardColumn key={col.id} col={col} members={members} onUpdate={onUpdate} onDelete={onDelete} adding={addingProps} actions={actionProps} />)}
        </div>
    );
}
