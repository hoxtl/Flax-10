/*
 * Composes timer state with task and modal flow.
 */

import { useEffect, useState, useRef } from 'react';
<<<<<<< HEAD
import { useNotify } from '../../notifications/hooks/useNotify';
=======
import { useNotify } from '../../Notifications/hooks/useNotify';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { getProgress } from '../utils/timerUtils';
import { useTimer } from './useTimer';
import { useTimerFlow } from './useTimerFlow';
import { useTimerHandlers } from './useTimerHandlers';

function syncTaskTitle(activeTaskMeta, setTask) {
  if (activeTaskMeta?.title == null || activeTaskMeta.title === '') return;
  setTask(activeTaskMeta.title);
}

function resolveWorkMinutes(activeTaskMeta) {
  const workMins = Number(activeTaskMeta?.estimatedWorkMinutes);
  if (Number.isFinite(workMins) && workMins > 0) return workMins;
  const blocks = Number(activeTaskMeta?.estimatedBlocks);
  if (!Number.isFinite(blocks) || blocks <= 0) return null;
  return Math.max(25, blocks * 25);
}

function resolveTargetSessions(activeTaskMeta) {
  const sessions = Number(activeTaskMeta?.estimatedSessionCount);
  return Number.isFinite(sessions) && sessions > 0 ? sessions : 1;
}

function applyTaskEstimate(t, activeTaskMeta) {
  const minutes = resolveWorkMinutes(activeTaskMeta);
  if (minutes === null) return;
  t.updateTime('sessions', resolveTargetSessions(activeTaskMeta));
  t.updateTime('work', minutes);
  t.setCompletedSessions(0);
  t.setMode('work');
  t.setTimeLeft(minutes * 60);
}

<<<<<<< HEAD
function useBuildTimerState(t, flow, task, setTask, activeTaskMeta) {
=======
function buildTimerState(t, flow, task, setTask, activeTaskMeta) {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  const handlers = useTimerHandlers(t, flow.modal, flow.setModal, flow.startNext, flow.resetBlockId, flow.endEarly);
  const isOvertime = t.timeLeft <= 0 && t.mode === 'work';
  const isBreakOvertime = t.timeLeft <= 0 && t.mode === 'break';

  return { ...t, ...flow, task, setTask, handlers, progress: getProgress(t), activeTaskMeta, isOvertime, isBreakOvertime };
}

<<<<<<< HEAD
function shouldApplyTaskEstimate(activeTaskId, activeTaskMeta, prevTaskId, prevMetaTitle) {
  const taskIdChanged = activeTaskId !== prevTaskId.current;
  const metaTitleChanged = activeTaskMeta?.title !== prevMetaTitle.current;
  return Boolean(activeTaskId && (taskIdChanged || metaTitleChanged));
}

function useTaskTitleSync(activeTaskMeta, setTask) {
  useEffect(() => syncTaskTitle(activeTaskMeta, setTask), [activeTaskMeta, setTask]);
}

function useTaskEstimateSync(activeTaskId, activeTaskMeta, t) {
  const prevTaskId = useRef(null);
  const prevMetaTitle = useRef(null);

  useEffect(() => {
    if (!shouldApplyTaskEstimate(activeTaskId, activeTaskMeta, prevTaskId, prevMetaTitle)) return;
    applyTaskEstimate(t, activeTaskMeta);
    prevTaskId.current = activeTaskId;
    prevMetaTitle.current = activeTaskMeta?.title;
  }, [activeTaskId, activeTaskMeta, t]);
}

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export function useTimerLogic(activeTaskId, _setActiveTaskId, activeTaskMeta) {
  const t = useTimer();
  const [task, setTask] = useState('');
  const notify = useNotify();
  const flow = useTimerFlow({ ...t, task, activeTaskId, activeTaskMeta }, notify);

<<<<<<< HEAD
  useTaskTitleSync(activeTaskMeta, setTask);
  useTaskEstimateSync(activeTaskId, activeTaskMeta, t);
  return useBuildTimerState(t, flow, task, setTask, activeTaskMeta);
=======
  const prevTaskId = useRef(null);
  const prevMetaTitle = useRef(null);

  useEffect(() => syncTaskTitle(activeTaskMeta, setTask), [activeTaskMeta]);
  
  useEffect(() => {
    const taskIdChanged = activeTaskId !== prevTaskId.current;
    const metaTitleChanged = activeTaskMeta?.title !== prevMetaTitle.current;
    
    if (activeTaskId && (taskIdChanged || metaTitleChanged)) {
      applyTaskEstimate(t, activeTaskMeta);
      prevTaskId.current = activeTaskId;
      prevMetaTitle.current = activeTaskMeta?.title;
    }
  }, [activeTaskId, activeTaskMeta, t]);

  return buildTimerState(t, flow, task, setTask, activeTaskMeta);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
