/*
 * GroupWork task board helpers.
 */

import styles from "../components/TaskBoardView.module.css";

export function buildBoardColumns(tasks) {
  const columns = { todo: [], in_progress: [], done: [] };
  tasks.forEach((task) => columns[getTaskColumnId(task)].push(task));
  return [
    buildColumn("todo", "To Do", columns.todo, styles.colTodo, styles.colTodoDot, styles.colTodoText),
    buildColumn("in_progress", "In Progress", columns.in_progress, styles.colInProgress, styles.colInProgressDot, styles.colInProgressText),
    buildColumn("done", "Done", columns.done, styles.colDone, styles.colDoneDot, styles.colDoneText),
  ];
}

function getTaskColumnId(task) {
  const status = task.status || (task.completed ? "done" : "todo");
  return status === "done" || status === "in_progress" ? status : "todo";
}

function buildColumn(id, title, tasks, className, dotClass, textClass) {
  return { id, title, tasks, className, dotClass, textClass };
}
