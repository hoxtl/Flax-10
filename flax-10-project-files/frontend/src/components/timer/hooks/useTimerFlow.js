/*
 * Timer completion and session flow state.
 */

import { useCallback, useRef, useState } from 'react';
import { logTaskTime } from '../../../api/taskApi';
import { playCompletionChime } from '../../../lib/sounds';
import { saveSession } from '../utils/historyUtils';
import { useCompletionCheck } from '../utils/timerUtils';

const AUTO_BREAK_SECONDS = 5 * 60;

function useTimerFlowState() {
  const [modal, setModal] = useState(null);
  const studyBlockId = useRef(Date.now());

  return { modal, setModal, studyBlockId };
}

function buildTaskLabel(t) {
  const moduleCode = t.activeTaskMeta?.moduleCode;
  if (!t.task) return '';
  return moduleCode ? `${t.task} - ${moduleCode}` : t.task;
}

function saveCurrentSession(t, studyBlockId, status) {
  const completed = status === 'Completed' ? t.completedSessions + 1 : t.completedSessions;
  saveSession(t.totalWork, t.totalBreak, completed, studyBlockId.current, buildTaskLabel(t), t.totalPaused, status);
}

function logActiveTaskMinutes(activeTaskId, totalWork) {
  if (!activeTaskId) return;
  logTaskTime(activeTaskId, Math.round(totalWork / 60));
}

function resetBlockMetrics(t) {
  t.updateSettings({ totalWork: 0, totalBreak: 0, totalPaused: 0 });
}

function showGoalModal(t, studyBlockId, setModal) {
  studyBlockId.current = Date.now();
  t.setIsActive(false);
  t.setTimeLeft(t.workTime * 60);
  setModal('goal');
}

function continueNextSession(t, modal) {
  t.setMode('work');
  t.setTimeLeft(t.workTime * 60);
  t.setIsActive(modal !== 'break');
}

function completeSession(state, t) {
  saveCurrentSession(t, state.studyBlockId, 'Completed');
  logActiveTaskMinutes(t.activeTaskId, t.totalWork);
  updateCompletedSession(state, t);
}

function updateCompletedSession(state, t) {
  const next = t.completedSessions + 1;
  t.setCompletedSessions(next);
  resetBlockMetrics(t);
  if (next >= t.targetSessions) return showGoalModal(t, state.studyBlockId, state.setModal);
  const prevModal = state.modal;
  state.setModal(null);
  continueNextSession(t, prevModal);
}

function resetFlow(state, t) {
  state.setModal(null);
  t.resetTimer();
}

function finishEarly(state, t) {
  if (t.totalWork > 0) saveCurrentSession(t, state.studyBlockId, 'Incomplete');
  logActiveTaskMinutes(t.activeTaskId, t.totalWork);
  resetFlow(state, t);
  state.studyBlockId.current = Date.now();
}

function launchAutoBreak(state, t) {
  playCompletionChime(0.3);
  state.setModal('autoBreak');
  t.setMode('break');
  t.setTimeLeft(AUTO_BREAK_SECONDS);
  t.setIsActive(true);
}

function finishAutoBreak(state, startNext) {
  if (state.modal !== 'autoBreak') return;
  startNext();
}

function useTimerFlowActions(state, t) {
  const startNext = useCallback(() => completeSession(state, t), [state, t]);
  const endEarly = useCallback(() => finishEarly(state, t), [state, t]);
  const onWorkComplete = useCallback(() => launchAutoBreak(state, t), [state, t]);
  const autoBreakDone = useCallback(() => finishAutoBreak(state, startNext), [state, startNext]);
  const resetBlockId = useCallback(() => { state.studyBlockId.current = Date.now(); }, [state.studyBlockId]);
  const resetTimer = useCallback(() => resetFlow(state, t), [state, t]);

  return { startNext, endEarly, onWorkComplete, autoBreakDone, resetBlockId, resetTimer };
}

export function useTimerFlow(t, notify) {
  const state = useTimerFlowState();
  const actions = useTimerFlowActions(state, t);

  useCompletionCheck(t, actions.startNext, notify, actions.onWorkComplete);
  return { ...state, ...actions, resetTimer: actions.resetTimer };
}
