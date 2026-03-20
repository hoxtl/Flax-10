/*
 * Composes timer state with task and modal flow.
 */

import { useEffect, useState } from 'react';
import { useNotify } from '../../Notifications/hooks/useNotify';
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

function buildTimerState(t, flow, task, setTask, activeTaskMeta) {
  const handlers = useTimerHandlers(t, flow.modal, flow.setModal, flow.startNext, flow.resetBlockId, flow.endEarly);
  const isOvertime = t.timeLeft <= 0 && t.mode === 'work';
  const isBreakOvertime = t.timeLeft <= 0 && t.mode === 'break';

  return { ...t, ...flow, task, setTask, handlers, progress: getProgress(t), activeTaskMeta, isOvertime, isBreakOvertime };
}

export function useTimerLogic(activeTaskId, _setActiveTaskId, activeTaskMeta) {
  const t = useTimer();
  const [task, setTask] = useState('');
  const notify = useNotify();
  const flow = useTimerFlow({ ...t, task, activeTaskId, activeTaskMeta }, notify);

  useEffect(() => syncTaskTitle(activeTaskMeta, setTask), [activeTaskMeta]);
  useEffect(() => applyTaskEstimate(t, activeTaskMeta), [activeTaskId, activeTaskMeta, t]);
  return buildTimerState(t, flow, task, setTask, activeTaskMeta);
}
