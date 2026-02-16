import styles from "./TaskRow.module.css";

export default function TaskRow({
  item,
  isEditing,
  editText,
  setEditText,
  onToggleDone,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDotsClick,
  isMenuActive,
}) {
  return (
    <>
      <input
        type="checkbox"
        checked={item.done}
        onChange={() => onToggleDone(item.id)}
      />

      {isEditing ? (
        <EditInput
          value={editText}
          onChange={setEditText}
          onSave={() => onSaveEdit(item.id)}
          onCancel={onCancelEdit}
        />
      ) : (
        <TaskLabel item={item} onStartEdit={() => onStartEdit(item)} />
      )}

      <DotsButton onClick={(e) => onDotsClick(e, item)} />
    </>
  );
}

function EditInput({ value, onChange, onSave, onCancel }) {
  return (
    <input
      className={styles.editInput}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
      onBlur={onSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave();
        if (e.key === "Escape") onCancel();
      }}
    />
  );
}

function TaskLabel({ item, onStartEdit }) {
  const className = item.urgent
    ? `${styles.urgentText} ${item.done ? styles.done : ""}`
    : item.done
    ? styles.done
    : "";

  return (
    <span
      className={className}
      onDoubleClick={onStartEdit}
      title="Double-click to edit"
    >
      {item.title}
    </span>
  );
}

function DotsButton({ onClick }) {
  return (
    <div className={styles.taskMenuRoot}>
      <button
        type="button"
        className={styles.taskMenuBtn}
        data-task-menu-btn="true"
        onClick={onClick}
        aria-label="Task options"
        title="Task options"
      >
        <span className={styles.taskDots}>•••</span>
      </button>
    </div>
  );
}