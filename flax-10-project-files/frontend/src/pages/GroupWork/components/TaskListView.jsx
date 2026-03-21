/*
 * GroupWork task list view.
 */

import TaskListRow from "./TaskListRow";
import styles from "./TaskListView.module.css";

export default function TaskListView({ tasks, members, onToggle, onUpdate, onDelete }) {
  if (tasks.length === 0) return <div className={styles.emptyState}>No tasks yet. Create one to get started!</div>;
  return (
    <div className={styles.taskList}>
      <div className={styles.headerRow}>
        <span className={styles.headerCell}>Task</span>
        <span className={styles.headerCell}>Priority</span>
        <span className={styles.headerCell}>Due date</span>
        <span className={styles.headerCell}>Assignee</span>
        <span />
      </div>
      {tasks.map((task) => <TaskListRow key={task.id} task={task} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />)}
    </div>
  );
}
