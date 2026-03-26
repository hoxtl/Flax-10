/*
 * GroupWork task board column.
 */

import TaskBoardCard from "./TaskBoardCard";
import { handleDragStartTask } from "../utils/taskUtils";
import styles from "./TaskBoardView.module.css";

function ColumnHeader({ column }) {
  return (
    <div className={styles.colHeader}>
      <div className={styles.colTitleWrapper}>
        <div className={`${styles.colDot} ${column.dotClass}`} />
        <h3 className={`${styles.colTitle} ${column.textClass}`}>{column.title}</h3>
      </div>
      <span className={styles.taskCount}>{column.tasks.length}</span>
    </div>
  );
}

function AddCardWidget({ columnId, addingToCol, setAddingToCol, newCardTitle, setNewCardTitle, onSubmit, onKeyDown }) {
  if (addingToCol === columnId) return <textarea autoFocus value={newCardTitle} onChange={(event) => setNewCardTitle(event.target.value)} onKeyDown={(event) => onKeyDown(event, columnId)} onBlur={(event) => onSubmit(event, columnId)} className={styles.addCardInput} placeholder="Enter title..." rows={2} />;
  return <button className={styles.addCardBtn} onClick={() => setAddingToCol(columnId)}>+ Add card</button>;
}

function EmptyColumnState({ isVisible }) {
  return isVisible ? <div className={styles.emptyCol}>No tasks</div> : null;
}

export default function TaskBoardColumn({ column, members, onUpdate, onDelete, adding }) {
  return (
    <div className={`${styles.column} ${column.className}`} onDragOver={preventDefault} onDrop={(event) => handleDrop(event, column.id, onUpdate)}>
      <ColumnHeader column={column} />
      <div className={styles.cardList}>
        {column.tasks.map((task) => <TaskBoardCard key={task.id} task={task} members={members} onUpdate={onUpdate} onDelete={onDelete} onDragStart={handleDragStartTask} />)}
        <EmptyColumnState isVisible={column.tasks.length === 0 && !adding.addingToCol} />
        <div className={styles.addCardInputWrapper}>
          <AddCardWidget columnId={column.id} {...adding} />
        </div>
      </div>
    </div>
  );
}

function preventDefault(event) {
  event.preventDefault();
}

function handleDrop(event, columnId, onUpdate) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("text/plain");
  if (taskId) onUpdate(Number(taskId), { status: columnId });
}
