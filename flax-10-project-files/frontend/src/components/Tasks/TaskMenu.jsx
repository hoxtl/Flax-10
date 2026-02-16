import { createPortal } from "react-dom";
import styles from "./TaskMenu.module.css";

export default function TaskMenu({
  item,
  taskMenuId,
  taskMenuRef,
  taskMenuPos,
  onToggleUrgent,
  onDelete,
}) 
{
  if (taskMenuId !== item.id) return null;

  const isUrgent = !!item.urgent;
  const canUrgent = !item.done;

  return createPortal(
    <div
      ref={taskMenuRef}
      className={styles.taskMenu}
      style={{ top: taskMenuPos.top, left: taskMenuPos.left }}
      role="menu"
    >
      {canUrgent && (
        <UrgentButton
          isUrgent={isUrgent}
          onClick={() => onToggleUrgent(item.id)}
        />
      )}

      <DeleteButton onClick={() => onDelete(item.id)} />
    </div>,
    document.body
  );
}

function UrgentButton({ isUrgent, onClick }) {
  return (
    <button
      type="button"
      className={styles.taskMenuItem}
      onClick={onClick}
      role="menuitem"
    >
      <span className={styles.taskMenuIcon} aria-hidden="true">
        ⚡
      </span>
      <span className={styles.taskMenuLabel}>
        {isUrgent ? "Remove urgent" : "Mark as urgent"}
      </span>
    </button>
  );
}

function DeleteButton({ onClick }) {
  return (
    <button
      type="button"
      className={styles.taskMenuItem}
      onClick={onClick}
      role="menuitem"
    >
      <span className={styles.taskMenuIcon} aria-hidden="true">
        🗑️
      </span>
      <span className={styles.taskMenuLabel}>Delete</span>
    </button>
  );
}