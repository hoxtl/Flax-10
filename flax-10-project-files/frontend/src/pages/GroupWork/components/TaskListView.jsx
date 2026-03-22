/*
 * GroupWork task list view.
 */

import SearchEmptyState from "../../../components/Common/SearchEmptyState/SearchEmptyState";
import TaskListRow from "./TaskListRow";
import styles from "./TaskListView.module.css";

const HEADER_CELLS = ["Task", "Priority", "Due date", "Assignee"];

function TaskListHeader() {
  return (
    <div className={styles.headerRow}>
      {HEADER_CELLS.map((label) => <span key={label} className={styles.headerCell}>{label}</span>)}
      <span />
    </div>
  );
}

export default function TaskListView({ tasks, members, onToggle, onUpdate, onDelete }) {
  if (tasks.length === 0) {
    return (
      <SearchEmptyState
        title="No tasks yet"
        hint="Add your first task to start assigning work and tracking progress."
        className={styles.emptyStateCard}
      />
    );
  }
  return (
    <div className={styles.taskList}>
      <TaskListHeader />
      {tasks.map((task) => <TaskListRow key={task.id} task={task} members={members} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />)}
    </div>
  );
}
