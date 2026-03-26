/*
 * Task input and picker for the timer.
 */

import { AnimatePresence, motion } from 'framer-motion';
import styles from '../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../common/primary_button/PrimaryButton';
import { TaskPickerModal } from './task_input/TaskPickerModal';
import { useTaskPickerData } from './task_input/useTaskPickerData';

const TASK_CARD_MOTION = {
  initial: { opacity: 0, y: -10, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.97 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
};

function openPicker(state) {
  if (!state.open) state.loadTasks();
  state.setOpen((value) => !value);
}

function selectTask(task, state, onChange, onTaskSelect) {
  state.setSelectedTaskId(task.id);
  onChange(task.title);
  state.setOpen(false);
  onTaskSelect?.(task);
}

function clearTask(state, onChange, onClearTask) {
  state.setSelectedTaskId(null);
  onChange('');
  onClearTask?.();
  state.setRecommendedTaskId(null);
}

function pickRecommendedTask(state, onChange, onTaskSelect) {
  if (!state.recommendedTask) return;
  state.setRecommendedTaskId(state.recommendedTask.id);
  window.setTimeout(() => selectTask(state.recommendedTask, state, onChange, onTaskSelect), 140);
}

function CurrentTaskCardInner({ value, onClearTask }) {
  return (
    <div className={styles.currentTaskCard}>
      <div className={styles.currentTaskCopy}>
        <div className={styles.currentTaskLabel}>Currently focusing on</div>
        <div className={styles.currentTaskValue}>{value}</div>
      </div>
      <PrimaryButton type="button" variant="ghost" size="small" pill className={styles.taskClearBtn} onClick={onClearTask} title="Clear selected task">Clear task</PrimaryButton>
    </div>
  );
}

function CurrentTaskCard({ value, onClearTask }) {
  return (
    <AnimatePresence initial={false}>
      {value && (
        <motion.div key="task-card" {...TASK_CARD_MOTION}>
          <CurrentTaskCardInner value={value} onClearTask={onClearTask} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActionButtons({ state, hasTaskValue, onOpenFocus }) {
  const taskButtonLabel = hasTaskValue ? 'Change task' : 'Choose a task to focus';

  return (
    <div className={styles.taskInputActions}>
      <div className={styles.taskInputActionsRow}>
        <PrimaryButton variant="primary" pill className={`${styles.taskPickBtn} ${styles.taskActionBtn}`} onClick={() => openPicker(state)} title={taskButtonLabel}>
          {taskButtonLabel}
        </PrimaryButton>
        {typeof onOpenFocus === 'function' && (
          <PrimaryButton variant="secondary" pill className={`${styles.fullFocusInlineBtn} ${styles.taskActionBtn}`} onClick={onOpenFocus}>
            Full Focus Mode ⚡
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

export function TaskInput({ value, onChange, onClearTask, onTaskSelect, onOpenFocus }) {
  const { ref, filterWrapRef, ...pickerState } = useTaskPickerData();
  const hasTaskValue = Boolean((value || '').trim());
  const clearSelectedTask = () => clearTask(pickerState, onChange, onClearTask);

  return (
    <div className={styles.taskInputWrap}>
      <div className={styles.taskInputContainer} ref={ref}>
        <CurrentTaskCard value={value} onClearTask={clearSelectedTask} />
        <ActionButtons state={pickerState} hasTaskValue={hasTaskValue} onOpenFocus={onOpenFocus} />
        <TaskPickerModal state={pickerState} filterWrapRef={filterWrapRef} onSelect={(task) => selectTask(task, pickerState, onChange, onTaskSelect)} onPickForMe={() => pickRecommendedTask(pickerState, onChange, onTaskSelect)} />
      </div>
    </div>
  );
}
