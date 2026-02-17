import { createPortal } from "react-dom";
import styles from "./TaskMenu.module.css";

function UrgentButton({ isUrgent, onClick }) {
  return (
    <button type="button" className={styles.taskMenuItem} onClick={onClick} role="menuitem">
      <span className={styles.taskMenuIcon} aria-hidden="true">⚡</span>
      <span className={styles.taskMenuLabel}>{isUrgent ? "Remove urgent" : "Mark as urgent"}</span>
    </button>
  );
}

function DeleteButton({ onClick }) {
  return (
    <button type="button" className={styles.taskMenuItem} onClick={onClick} role="menuitem">
      <span className={styles.taskMenuIcon} aria-hidden="true">🗑️</span>
      <span className={styles.taskMenuLabel}>Delete</span>
    </button>
  );
}

function TaskMenuContent({ item, taskMenuRef, taskMenuPos, onToggleUrgent, onDelete }) {
  return (
    <div ref={taskMenuRef} className={styles.taskMenu} style={{ top: taskMenuPos.top, left: taskMenuPos.left }} role="menu">
      {!item.done && <UrgentButton isUrgent={!!item.urgent} onClick={() => onToggleUrgent(item.id)} />}
      <DeleteButton onClick={() => onDelete(item.id)} />
    </div>
  );
}

export default function TaskMenu({ item, taskMenuId, taskMenuRef, taskMenuPos, onToggleUrgent, onDelete }) {
  if (taskMenuId !== item.id) return null;
  return createPortal(
    <TaskMenuContent item={item} taskMenuRef={taskMenuRef} taskMenuPos={taskMenuPos} onToggleUrgent={onToggleUrgent} onDelete={onDelete} />,
    document.body
  );
}