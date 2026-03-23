import { useRef, useState } from "react";
import styles from "./TaskTimelineView.module.css";
import cardStyles from "./TaskTimelineCard.module.css";
import TaskAvatarStack from "./TaskAvatarStack";
import TaskAssigneePopup from "./TaskAssigneePopup";
import TaskContextMenu from "./TaskContextMenu";
import { useTaskTitleEdit } from "./taskCardEditUtils";
import { getPriorityStyle } from "../utils/priorityUtils";
import { buildToggleAssignee, filterVisibleAssignees, handleDragStartTask } from "../utils/taskUtils";

function CardEditInput({ editTitle, setEditTitle, saveEdit, setEditing, inputClassName }) {
  return (
    <input
      autoFocus
      className={inputClassName}
      value={editTitle}
      onChange={(event) => setEditTitle(event.target.value)}
      onBlur={saveEdit}
      onKeyDown={(event) => {
        if (event.key === "Enter") saveEdit();
        if (event.key === "Escape") setEditing(false);
      }}
    />
  );
}

function CardTitleOrEdit({ editing, editTitle, setEditTitle, saveEdit, setEditing, color, task }) {
  if (editing) {
    return <CardEditInput editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} setEditing={setEditing} inputClassName={cardStyles.timelineCardInput} />;
  }
  return <div className={cardStyles.cardTitle} style={{ color: color.text }}>{task.title}</div>;
}

function buildTimelineCardStyle(color, showPopup) {
  return {
    background: color.bg,
    border: `1.5px solid ${color.border}`,
    position: showPopup ? "relative" : "static",
    zIndex: showPopup ? 50 : "auto",
  };
}

function TimelineCardBody({ task, editing, editTitle, setEditTitle, setEditing, saveEdit, color, showPopup, setShowPopup, members, assignees, toggle }) {
  const triggerRef = useRef(null);
  const fullCardStyle = { ...buildTimelineCardStyle(color, showPopup), opacity: task.completed ? 0.6 : 1 };
  const badgeVars = { "--pb-color": color.color, "--pb-bg": color.backgroundColor };

  return (
    <div className={cardStyles.timelineCard} style={fullCardStyle}>
      <CardTitleOrEdit editing={editing} editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} setEditing={setEditing} color={color} task={task} />
      <div className={cardStyles.cardFooter}>
        <span className={`${cardStyles.cardPriorityBadge} ${cardStyles.cardPriorityBadgeColored}`} style={badgeVars}>{task.priority || "MEDIUM"}</span>
        <div ref={triggerRef} className={cardStyles.avatarTrigger} onClick={(event) => { event.stopPropagation(); setShowPopup((value) => !value); }}>
          <TaskAvatarStack assignees={assignees} size={16} max={2} />
        </div>
      </div>
      <TaskAssigneePopup isOpen={showPopup} onClose={() => setShowPopup(false)} members={members} assignees={assignees} onToggleAssignee={toggle} triggerRef={triggerRef} />
    </div>
  );
}

export function TimelineCard({ task, members, assignees, onUpdate, onDelete }) {
  const [showPopup, setShowPopup] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const { editing, editTitle, setEditTitle, setEditing, saveEdit } = useTaskTitleEdit(task, onUpdate);
  const color = getPriorityStyle(task.priority);
  const toggle = buildToggleAssignee(assignees, task.id, onUpdate);
  const handleContextMenu = (event) => {
    event.preventDefault();
    setCtxMenu({ x: event.clientX, y: event.clientY });
  };

  return (
    <>
      <div draggable onDragStart={(event) => { event.stopPropagation(); handleDragStartTask(event, task.id); }} onContextMenu={handleContextMenu}>
        <TimelineCardBody task={task} editing={editing} editTitle={editTitle} setEditTitle={setEditTitle} setEditing={setEditing} saveEdit={saveEdit} color={color} showPopup={showPopup} setShowPopup={setShowPopup} members={members} assignees={assignees} toggle={toggle} />
      </div>
      {ctxMenu && <TaskContextMenu pos={ctxMenu} task={task} onDelete={onDelete} onClose={() => setCtxMenu(null)} onEditStart={() => setEditing(true)} />}
    </>
  );
}

function UnscheduledCardContent({ task, members, editing, editTitle, setEditTitle, saveEdit, setEditing }) {
  const style = getPriorityStyle(task.priority);
  const badgeVars = { "--pb-color": style.color, "--pb-bg": style.backgroundColor };
  return (
    <>
      {editing ? (
        <CardEditInput editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} setEditing={setEditing} inputClassName={styles.unscheduledCardInput} />
      ) : (
        <div className={styles.unscheduledCardTitle}>{task.title}</div>
      )}
      <div className={styles.unscheduledCardFooter}>
        <span className={`${styles.priorityBadge} ${styles.priorityBadgeColored}`} style={badgeVars}>{(task.priority || "medium").toUpperCase()}</span>
        <TaskAvatarStack assignees={filterVisibleAssignees(task.assignees_info || [], members)} size={16} />
      </div>
    </>
  );
}

export function UnscheduledCard({ task, members, onDelete, onUpdate }) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const { editing, editTitle, setEditTitle, setEditing, saveEdit } = useTaskTitleEdit(task, onUpdate);
  const handleContextMenu = (event) => {
    event.preventDefault();
    setCtxMenu({ x: event.clientX, y: event.clientY });
  };

  return (
    <>
      <div className={styles.unscheduledCard} draggable onDragStart={(event) => handleDragStartTask(event, task.id)} onContextMenu={handleContextMenu}>
        <UnscheduledCardContent task={task} members={members} editing={editing} editTitle={editTitle} setEditTitle={setEditTitle} saveEdit={saveEdit} setEditing={setEditing} />
      </div>
      {ctxMenu && <TaskContextMenu pos={ctxMenu} task={task} onDelete={onDelete} onClose={() => setCtxMenu(null)} onEditStart={() => setEditing(true)} />}
    </>
  );
}
