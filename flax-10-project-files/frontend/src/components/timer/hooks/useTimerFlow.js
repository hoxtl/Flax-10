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
<<<<<<< HEAD
  const studyBlockId = useRef(Date.now());

  return { modal, setModal, studyBlockId };
=======
  const [distractionCount, setDistractionCount] = useState(0);
  const studyBlockId = useRef(Date.now());

  return { modal, setModal, distractionCount, setDistractionCount, studyBlockId };
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function buildTaskLabel(t) {
  const moduleCode = t.activeTaskMeta?.moduleCode;
  if (!t.task) return '';
  return moduleCode ? `${t.task} - ${moduleCode}` : t.task;
}

<<<<<<< HEAD
function saveCurrentSession(t, studyBlockId, status) {
  const completed = status === 'Completed' ? t.completedSessions + 1 : t.completedSessions;
  saveSession(t.totalWork, t.totalBreak, completed, studyBlockId.current, buildTaskLabel(t), t.totalPaused, status);
=======
function saveCurrentSession(t, studyBlockId, distractionCount, status) {
  const completed = status === 'Completed' ? t.completedSessions + 1 : t.completedSessions;
  saveSession(t.totalWork, t.totalBreak, completed, studyBlockId.current, buildTaskLabel(t), t.totalPaused, status, distractionCount);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function logActiveTaskMinutes(activeTaskId, totalWork) {
  if (!activeTaskId) return;
  logTaskTime(activeTaskId, Math.round(totalWork / 60));
}

<<<<<<< HEAD
function resetBlockMetrics(t) {
=======
function resetBlockMetrics(t, setDistractionCount) {
  setDistractionCount(0);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD
  saveCurrentSession(t, state.studyBlockId, 'Completed');
=======
  saveCurrentSession(t, state.studyBlockId, state.distractionCount, 'Completed');
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  logActiveTaskMinutes(t.activeTaskId, t.totalWork);
  updateCompletedSession(state, t);
}

function updateCompletedSession(state, t) {
  const next = t.completedSessions + 1;
  t.setCompletedSessions(next);
<<<<<<< HEAD
  resetBlockMetrics(t);
=======
  resetBlockMetrics(t, state.setDistractionCount);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  if (next >= t.targetSessions) return showGoalModal(t, state.studyBlockId, state.setModal);
  continueNextSession(t, state.modal);
}

function resetFlow(state, t) {
  state.setModal(null);
<<<<<<< HEAD
=======
  state.setDistractionCount(0);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  t.resetTimer();
}

function finishEarly(state, t) {
<<<<<<< HEAD
  if (t.totalWork > 0) saveCurrentSession(t, state.studyBlockId, 'Incomplete');
=======
  if (t.totalWork > 0) saveCurrentSession(t, state.studyBlockId, state.distractionCount, 'Incomplete');
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD
=======
  state.setDistractionCount(0);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD

  useCompletionCheck(t, actions.startNext, notify, actions.onWorkComplete);
  return { ...state, ...actions, resetTimer: actions.resetTimer };
=======
  const addDistraction = useCallback(() => state.setDistractionCount((value) => value + 1), [state]);

  useCompletionCheck(t, actions.startNext, notify, actions.onWorkComplete);
  return { ...state, ...actions, addDistraction, resetTimer: actions.resetTimer };
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
