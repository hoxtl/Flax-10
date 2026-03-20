/*
 * Task input and picker for the timer.
 */

import styles from '../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../common/PrimaryButton/PrimaryButton';
import { TaskPickerModal } from './taskInput/TaskPickerModal';
import { useTaskPickerData } from './taskInput/useTaskPickerData';

function openPicker(state) {
  if (!state.open) state.loadTasks();
  state.setOpen((value) => !value);
}

function selectTask(task, state, onChange, onTaskSelect) {
  onChange(task.title);
  state.setOpen(false);
  onTaskSelect?.(task);
}

function clearTask(state, onChange, onClearTask) {
  onChange('');
  onClearTask?.();
  state.setRecommendedTaskId(null);
}

function pickRecommendedTask(state, onChange, onTaskSelect) {
  if (!state.recommendedTask) return;
  state.setRecommendedTaskId(state.recommendedTask.id);
  window.setTimeout(() => selectTask(state.recommendedTask, state, onChange, onTaskSelect), 140);
}

function ActionButtons({ state, hasTaskValue, isCompact, onClearTask, onOpenFocus }) {
  if (isCompact) return <CompactActions state={state} hasTaskValue={hasTaskValue} onClearTask={onClearTask} />;
  return <ExpandedActions state={state} hasTaskValue={hasTaskValue} onClearTask={onClearTask} onOpenFocus={onOpenFocus} />;
}

function ExpandedActions({ state, hasTaskValue, onClearTask, onOpenFocus }) {
  return (
    <div className={styles.taskInputActions}>
      <div className={styles.taskInputActionsRow}>
        <PrimaryButton variant="primary" pill className={styles.taskPickBtn} onClick={() => openPicker(state)} title="Select a task">Choose a task to focus</PrimaryButton>
        {typeof onOpenFocus === 'function' && <PrimaryButton variant="secondary" pill className={styles.fullFocusInlineBtn} onClick={onOpenFocus}>Full Focus Mode ⚡</PrimaryButton>}
      </div>
      {hasTaskValue && <button type="button" className={styles.taskClearBtn} onClick={onClearTask} title="Clear selected task">Clear task</button>}
    </div>
  );
}

function CompactActions({ state, hasTaskValue, onClearTask }) {
  return (
    <div className={`${styles.taskInputActions} ${styles.taskInputActionsCompact}`}>
      <button type="button" className={styles.taskPickBtn} onClick={() => openPicker(state)} title="Change task">Change task</button>
      {hasTaskValue && <button type="button" className={styles.taskClearBtn} onClick={onClearTask} title="Clear selected task">Clear task</button>}
    </div>
  );
}

export function TaskInput({ value, onChange, onClearTask, onTaskSelect, isSessionActive = false, onOpenFocus }) {
  const state = useTaskPickerData();
  const isCompact = Boolean(isSessionActive && value);
  const hasTaskValue = Boolean((value || '').trim());
  const inputClassName = `${styles.taskInput} ${value ? styles.taskInputHasValue : ''} ${isCompact ? styles.taskInputCompact : ''}`;

  return (
    <div className={styles.taskInputWrap}>
      {value && <div className={styles.currentTaskLabel}>Currently focusing on:</div>}
      <div className={styles.taskInputContainer} ref={state.ref}>
        <input type="text" className={inputClassName} placeholder={isCompact ? 'Task in progress' : 'What are you working on? 🎯'} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && event.target.blur()} />
        <ActionButtons state={state} hasTaskValue={hasTaskValue} isCompact={isCompact} onClearTask={() => clearTask(state, onChange, onClearTask)} onOpenFocus={onOpenFocus} />
        <TaskPickerModal state={state} value={value} onSelect={(task) => selectTask(task, state, onChange, onTaskSelect)} onPickForMe={() => pickRecommendedTask(state, onChange, onTaskSelect)} />
      </div>
    </div>
  );
}
