import { useCallback, useEffect } from "react";
import styles from "../../pages/Timer/TimerPage.module.css";
import TreeAnimation from './TreeAnimation';
import { TimerDisplay, ModeIndicator, SessionStatus, TimerControls, TimerSettings, SoundSelector, TaskInput } from './TimerComponents';
import { OvertimePopup, GoalModal, BreakModal, EndEarlyModal } from './TimerPopups';
import HistoryModal from './HistoryModal';
import { splitEstimatedBlocks } from '../../lib/focusPlanner';

/** Header with title and history button (original layout) */
const TimerHeader = ({ onOpenHistory, isMobile }) => (
  <div className={styles.header}>
    <div className={styles.title}>Study Timer</div>
    {!isMobile && (
      <button className={styles.historyButton} onClick={onOpenHistory} aria-label="History">
        History 📜
      </button>
    )}
  </div>
);

const TimerTopSection = ({ t, onOpenHistory, isMobile }) => {
    const handleTaskSelect = useCallback((task) => {
        t.setTask(task.title);
        const split = splitEstimatedBlocks(task.estimated_blocks || 1);
        t.updateTime('work', split.workMinutes);
        t.updateTime('sessions', split.sessionCount);
        t.setTimeLeft(split.workMinutes * 60);
        t.setIsActive(true);
        if (t.setActiveTaskId) {
            t.setActiveTaskId(task.id, {
                title: task.title,
                categoryColor: task.list_color,
                estimatedBlocks: Number(task.estimated_blocks || 1),
                estimatedSessionCount: split.sessionCount,
                estimatedWorkMinutes: split.workMinutes,
            });
        }
        try { sessionStorage.setItem('timerTaskId', String(task.id)); } catch (_) {}
    }, [t]);

    useEffect(() => {
        try {
            const suggested = sessionStorage.getItem('timerSuggestedTask');
            if (suggested && typeof t.setTask === 'function') {
                t.setTask(suggested);
                sessionStorage.removeItem('timerSuggestedTask');
            }
        } catch (_) {}
    }, [t]);

    const mobileBtn = isMobile ? <button className={styles.mobileHistoryBtn} onClick={onOpenHistory}>View History 📜</button> : null;
    const header = <TimerHeader onOpenHistory={onOpenHistory} isMobile={isMobile} />;
    const input = <TaskInput value={t.task} onChange={t.setTask} onTaskSelect={handleTaskSelect} />;
    const tree = <TreeAnimation progress={t.progress} mode={t.mode} />;
    return <>{header}{input}{mobileBtn}{tree}</>;
};

const TimerInfoSection = ({ t }) => {
    const isOvertime = t.isOvertime || t.isBreakOvertime;
    const indicator = <ModeIndicator mode={t.mode} isOvertime={t.isOvertime} isBreakOvertime={t.isBreakOvertime} />;
    const status = <SessionStatus current={t.completedSessions} total={t.targetSessions} />;
    const display = <TimerDisplay timeLeft={t.timeLeft} mode={t.mode} isOvertime={isOvertime} />;
    return <>{indicator}{status}{display}</>;
};

const TimerBottomSection = ({ t }) => {
    const controls = <TimerControls isActive={t.isActive} isPaused={t.isPaused} onToggle={() => t.setIsActive(true)} onPause={t.togglePause} onReset={t.resetTimer} totalPaused={t.totalPaused} onEndEarly={() => t.setModal('endEarly')} />;
    const settings = <TimerSettings work={t.workTime} breakTime={t.breakTime} sessions={t.targetSessions} onUpdate={t.updateTime} isActive={t.isActive} />;
    const sound = <SoundSelector />;
    return <>{controls}{settings}{sound}</>;
};

export const MainSection = ({ t, onOpenHistory, isMobile }) => {
    const top = <TimerTopSection t={t} onOpenHistory={onOpenHistory} isMobile={isMobile} />;
    const info = <TimerInfoSection t={t} />;
    const bottom = <TimerBottomSection t={t} />;
    return <>{top}{info}{bottom}</>;
};

export const PopupSection = ({ t, showHistory, onCloseHistory }) => {
    const h = showHistory ? <HistoryModal onClose={onCloseHistory} /> : null;
    const oWork = t.isOvertime ? <OvertimePopup mode="work" time={t.timeLeft} onAction={t.handlers.break} isLastSession={(t.completedSessions + 1) >= t.targetSessions} /> : null;
    const oBreak = t.isBreakOvertime ? <OvertimePopup mode="break" time={t.timeLeft} onAction={t.handlers.overtimeBreak} /> : null;
    const bModal = t.modal === 'break' ? <BreakModal onAction={t.handlers.break} isLastSession={(t.completedSessions + 1) >= t.targetSessions} /> : null;
    const gModal = t.modal === 'goal' ? <GoalModal sessions={t.completedSessions} workTime={t.blockTotalWork} breakTime={t.blockTotalBreak} onAction={t.handlers.goal} /> : null;
    const eModal = t.modal === 'endEarly' ? <EndEarlyModal onConfirm={t.handlers.endEarly} onCancel={() => t.setModal(null)} /> : null;
    return <>{h}{oWork}{oBreak}{bModal}{gModal}{eModal}</>;
};
