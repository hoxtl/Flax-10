/*
 * Task input and picker for the timer.
 */

<<<<<<< HEAD
import { AnimatePresence, motion } from 'framer-motion';
import styles from '../../pages/timer/TimerPage.module.css';
import PrimaryButton from '../common/primary_button/PrimaryButton';
import { TaskPickerModal } from './task_input/TaskPickerModal';
import { useTaskPickerData } from './task_input/useTaskPickerData';

const TASK_CARD_MOTION = {
  initial: { opacity: 0, y: -10, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.97 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
};

export function openPicker(state) {
=======
import styles from '../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../common/PrimaryButton/PrimaryButton';
import { TaskPickerModal } from './taskInput/TaskPickerModal';
import { useTaskPickerData } from './taskInput/useTaskPickerData';

function openPicker(state) {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  if (!state.open) state.loadTasks();
  state.setOpen((value) => !value);
}

<<<<<<< HEAD
export function selectTask(task, state, onChange, onTaskSelect) {
=======
function selectTask(task, state, onChange, onTaskSelect) {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  state.setSelectedTaskId(task.id);
  onChange(task.title);
  state.setOpen(false);
  onTaskSelect?.(task);
}

<<<<<<< HEAD
export function clearTask(state, onChange, onClearTask) {
=======
function clearTask(state, onChange, onClearTask) {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  state.setSelectedTaskId(null);
  onChange('');
  onClearTask?.();
  state.setRecommendedTaskId(null);
}

<<<<<<< HEAD
export function pickRecommendedTask(state, onChange, onTaskSelect) {
=======
function pickRecommendedTask(state, onChange, onTaskSelect) {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  if (!state.recommendedTask) return;
  state.setRecommendedTaskId(state.recommendedTask.id);
  window.setTimeout(() => selectTask(state.recommendedTask, state, onChange, onTaskSelect), 140);
}

<<<<<<< HEAD
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
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </div>
  );
}

<<<<<<< HEAD
export function TaskInput({ value, onChange, onClearTask, onTaskSelect, onOpenFocus }) {
  const { ref, filterWrapRef, ...pickerState } = useTaskPickerData();
  const hasTaskValue = Boolean((value || '').trim());
  const clearSelectedTask = () => clearTask(pickerState, onChange, onClearTask);

  return (
    <div className={styles.taskInputWrap}>
      <div className={styles.taskInputContainer} ref={ref}>
        <CurrentTaskCard value={value} onClearTask={clearSelectedTask} />
        <ActionButtons state={pickerState} hasTaskValue={hasTaskValue} onOpenFocus={onOpenFocus} />
=======
function CompactActions({ state, hasTaskValue, onClearTask }) {
  return (
    <div className={`${styles.taskInputActions} ${styles.taskInputActionsCompact}`}>
      <button type="button" className={styles.taskPickBtn} onClick={() => openPicker(state)} title="Change task">Change task</button>
      {hasTaskValue && <button type="button" className={styles.taskClearBtn} onClick={onClearTask} title="Clear selected task">Clear task</button>}
    </div>
  );
}

export function TaskInput({ value, onChange, onClearTask, onTaskSelect, isSessionActive = false, onOpenFocus }) {
  const { ref, filterWrapRef, ...pickerState } = useTaskPickerData();
  const isCompact = Boolean(isSessionActive && value);
  const hasTaskValue = Boolean((value || '').trim());
  const inputClassName = `${styles.taskInput} ${value ? styles.taskInputHasValue : ''} ${isCompact ? styles.taskInputCompact : ''}`;

  return (
    <div className={styles.taskInputWrap}>
      {value && <div className={styles.currentTaskLabel}>Currently focusing on:</div>}
      <div className={styles.taskInputContainer} ref={ref}>
        <input type="text" className={inputClassName} placeholder={isCompact ? 'Task in progress' : 'What are you working on? 🎯'} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && event.target.blur()} />
        <ActionButtons state={pickerState} hasTaskValue={hasTaskValue} isCompact={isCompact} onClearTask={() => clearTask(pickerState, onChange, onClearTask)} onOpenFocus={onOpenFocus} />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        <TaskPickerModal state={pickerState} filterWrapRef={filterWrapRef} onSelect={(task) => selectTask(task, pickerState, onChange, onTaskSelect)} onPickForMe={() => pickRecommendedTask(pickerState, onChange, onTaskSelect)} />
      </div>
    </div>
  );
}
