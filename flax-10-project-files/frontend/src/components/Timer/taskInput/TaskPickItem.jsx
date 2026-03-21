/*
 * Task picker option card.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import { getTaskDurationLabel, getTaskUrgencyTone } from './taskInputUtils';

function getUrgencyClass(urgencyTone) {
  if (urgencyTone === 'hot') return styles.taskPickItemHot;
  if (urgencyTone === 'warm') return styles.taskPickItemWarm;
  return styles.taskPickItemCool;
}

function getTaskMarker(task, urgencyTone) {
  if (urgencyTone === 'hot') return '🔥';
  return task.module_code ? '🦁' : null;
}

export function TaskPickItem({ task, selectedTaskId, recommendedTaskId, onSelect }) {
  const urgencyTone = getTaskUrgencyTone(task);
  const isSelected = String(selectedTaskId) === String(task.id);
  const className = `${styles.taskPickItem} ${getUrgencyClass(urgencyTone)} ${isSelected ? styles.taskPickItemSelected : ''} ${recommendedTaskId === task.id ? styles.taskPickItemRecommended : ''}`;

  return (
    <button key={task.id} type="button" className={className} onClick={() => onSelect(task)} title={task.title}>
      <TaskPickItemContent task={task} urgencyTone={urgencyTone} />
    </button>
  );
}

function TaskPickItemContent({ task, urgencyTone }) {
  const taskMarker = getTaskMarker(task, urgencyTone);
  const moduleOrList = task.module_code || task.list_name;

  return (
    <div className={styles.taskPickItemContent}>
      <span className={styles.taskPickSingleLine}>
        <span className={styles.taskPickTitleRow}>
          {taskMarker && <span className={styles.taskPickPriorityIcon}>{taskMarker}</span>}
          <span className={styles.taskPickTitle}>{task.title}</span>
        </span>
        <span className={styles.taskPickInlineMeta}>
          <span className={styles.taskPickDurationInline}>{getTaskDurationLabel(task)}</span>
          <span className={styles.taskPickMetaDivider}>•</span>
          <span className={styles.taskPickMetaLine}>{moduleOrList}</span>
        </span>
      </span>
    </div>
  );
}
