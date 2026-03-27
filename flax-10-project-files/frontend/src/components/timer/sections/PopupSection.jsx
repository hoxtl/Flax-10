/*
 * Timer modal and popup rendering.
 */

import HistoryModal from '../components/HistoryModal';
import {
  OvertimePopup,
  GoalModal,
  BreakModal,
  EndEarlyModal,
  BreakStartedPopup,
} from '../components/TimerPopups';
import { AUTOSTART_KEY } from '../utils/presetUtils';
import { useTimerPopupEffects } from '../hooks/useTimerPopupEffects';

function buildGoalState(t) {
  const currentGoalSec = Math.max(60, Number((t.mode === 'break' ? t.breakTime : t.workTime) || 25) * 60);
  const currentElapsedSec = Math.max(0, currentGoalSec - Math.max(0, Number(t.timeLeft || 0)));
  return { currentGoalSec, currentElapsedSec };
}

function TimerModals({ t }) {
  const autoStart = localStorage.getItem(AUTOSTART_KEY) === 'true';
  const isLastSession = t.completedSessions + 1 >= t.targetSessions;
  const { currentGoalSec, currentElapsedSec } = buildGoalState(t);

  return (
    <>
      {t.modal === 'autoBreak' && <BreakStartedPopup time={t.timeLeft} onAction={t.handlers.autoBreakDone} />}
      {t.isOvertime && <OvertimePopup mode="work" time={t.timeLeft} onAction={t.handlers.break} isLastSession={isLastSession} />}
      {t.isBreakOvertime && <OvertimePopup mode="break" time={t.timeLeft} onAction={t.handlers.overtimeBreak} />}
      {t.modal === 'break' && !autoStart && <BreakModal onAction={t.handlers.break} isLastSession={isLastSession} />}
      {t.modal === 'goal' && <GoalModal sessions={t.completedSessions} workTime={t.blockTotalWork} breakTime={t.blockTotalBreak} onAction={t.handlers.goal} />}
      {t.modal === 'endEarly' && <EndEarlyModal onConfirm={t.handlers.endEarly} onCancel={() => t.setModal(null)} elapsedSeconds={currentElapsedSec} goalSeconds={currentGoalSec} />}
    </>
  );
}

export function PopupSection({ t, showHistory, onCloseHistory, disabled = false }) {
  useTimerPopupEffects(t);
  if (disabled) return null;

  return (
    <>
      {showHistory && <HistoryModal onClose={onCloseHistory} />}

      <TimerModals t={t} />
    </>
  );
}
