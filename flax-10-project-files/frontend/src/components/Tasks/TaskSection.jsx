import { Reorder } from "framer-motion";
import styles from "./TaskSection.module.css";
import rowStyles from "./TaskRow.module.css";
import TaskRow from "./TaskRow";
import TaskMenu from "./TaskMenu";

export function UrgentSection({
  items,
  editingId,
  editText,
  setEditText,
  taskMenuId,
  onToggleDone,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDotsClick,
  onToggleUrgent,
  onDelete,
  taskMenuRef,
  taskMenuPos,
}) {
  if (items.length === 0) return null;

  return (
    <div className={styles.section}>
      <SectionTitle text="URGENT" showBang />
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item}
          className={`${rowStyles.row} ${taskMenuId === item.id ? rowStyles.rowActive : ""}`}
          whileDrag={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        >
          <TaskRow
            item={item}
            isEditing={editingId === item.id}
            editText={editText}
            setEditText={setEditText}
            onToggleDone={onToggleDone}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onStartEdit={onStartEdit}
            onDotsClick={onDotsClick}
            isMenuActive={taskMenuId === item.id}
          />
          <TaskMenu
            item={item}
            taskMenuId={taskMenuId}
            taskMenuRef={taskMenuRef}
            taskMenuPos={taskMenuPos}
            onToggleUrgent={onToggleUrgent}
            onDelete={onDelete}
          />
        </Reorder.Item>
      ))}
    </div>
  );
}

export function OthersSection({
  items,
  editingId,
  editText,
  setEditText,
  taskMenuId,
  onToggleDone,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDotsClick,
  onToggleUrgent,
  onDelete,
  taskMenuRef,
  taskMenuPos,
}) {
  if (items.length === 0) return null;

  return (
    <div className={styles.section}>
      <SectionTitle text="OTHERS" />
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item}
          className={`${rowStyles.row} ${taskMenuId === item.id ? rowStyles.rowActive : ""}`}
          whileDrag={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        >
          <TaskRow
            item={item}
            isEditing={editingId === item.id}
            editText={editText}
            setEditText={setEditText}
            onToggleDone={onToggleDone}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onStartEdit={onStartEdit}
            onDotsClick={onDotsClick}
            isMenuActive={taskMenuId === item.id}
          />
          <TaskMenu
            item={item}
            taskMenuId={taskMenuId}
            taskMenuRef={taskMenuRef}
            taskMenuPos={taskMenuPos}
            onToggleUrgent={onToggleUrgent}
            onDelete={onDelete}
          />
        </Reorder.Item>
      ))}
    </div>
  );
}

export function DoneSection({
  items,
  taskMenuId,
  onToggleDone,
  onDotsClick,
  onToggleUrgent,
  onDelete,
  taskMenuRef,
  taskMenuPos,
}) {
  if (items.length === 0) return null;

  return (
    <div className={styles.section}>
      <div className={styles.doneTitle}>DONE</div>
      {items.map((item) => (
        <div
          key={item.id}
          className={`${rowStyles.row} ${taskMenuId === item.id ? rowStyles.rowActive : ""}`}
        >
          <TaskRow
            item={item}
            isEditing={false}
            editText=""
            setEditText={() => {}}
            onToggleDone={onToggleDone}
            onSaveEdit={() => {}}
            onCancelEdit={() => {}}
            onStartEdit={() => {}}
            onDotsClick={onDotsClick}
            isMenuActive={taskMenuId === item.id}
          />
          <TaskMenu
            item={item}
            taskMenuId={taskMenuId}
            taskMenuRef={taskMenuRef}
            taskMenuPos={taskMenuPos}
            onToggleUrgent={onToggleUrgent}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ text, showBang = false }) {
  return (
    <div className={styles.sectionTitle}>
      {text}{" "}
      {showBang && <span className={styles.urgentBang} aria-hidden="true">!</span>}
    </div>
  );
}