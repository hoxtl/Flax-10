/**
 * Task widget — always visible; context-aware empty: brand new vs all completed.
 */

import { useMemo } from "react";
import { isToday } from "../../../components/Calendar/utils/dateUtils";
import { TaskWidgetRow } from "./TaskWidgetRow";
import styles from "../Homepage.module.css";

export function TaskWidget({ tasks, selectedDate, onViewAllTasks, onPlay, onAddTask, backlogLabel, activeTimerTaskId, isBrandNew, isAllCompleted }) {
  const topTasks = useMemo(() => tasks.slice(0, 5), [tasks]);
  const label = backlogLabel ? "TO SCHEDULE" : (isToday(selectedDate) ? "TODAY'S TASKS" : "TASKS DUE");
  const isEmpty = topTasks.length === 0;

  const emptyMessage = isBrandNew
    ? "🌱 Your garden is clear — plant your first goal?"
    : isAllCompleted
      ? "🌳 Forest complete — rest and grow"
      : "🌳 Forest complete — rest and grow";
  const emptyIcon = isBrandNew ? "🌱" : isAllCompleted ? "🌳" : "🌿";

  return (
    <div className={styles.taskWidget}>
      <div className={styles.taskWidgetHeader}>
        <span className={styles.taskWidgetTitle}>{label}</span>
        <div className={styles.taskWidgetHeaderActions}>
          {isEmpty && onAddTask && (
            <button type="button" className={styles.taskWidgetAddBtn} onClick={onAddTask} title="Add task" aria-label="Add task">
              +
            </button>
          )}
          <button type="button" className={styles.taskWidgetLink} onClick={() => onViewAllTasks?.()}>
            All tasks →
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className={styles.taskWidgetEmpty}>
          <span className={styles.taskWidgetEmptyIcon} aria-hidden>{emptyIcon}</span>
          <p className={styles.taskWidgetEmptyText}>{emptyMessage}</p>
          {onAddTask && (isBrandNew || !isAllCompleted) && (
            <button type="button" className={styles.taskWidgetEmptyBtn} onClick={onAddTask}>
              + Add Task
            </button>
          )}
        </div>
      ) : (
        <div className={styles.taskWidgetList}>
          {topTasks.map((task) => (
            <TaskWidgetRow
              key={task.id}
              task={task}
              onPlay={onPlay}
              isActiveInTimer={activeTimerTaskId != null && String(task.id) === String(activeTimerTaskId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
