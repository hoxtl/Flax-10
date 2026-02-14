import styles from '../../pages/TimerPage.module.css';
import TreeAnimation from './TreeAnimation';
import { TimerDisplay, ModeIndicator, SessionStatus, TimerControls, TimerSettings } from './TimerComponents';
import { OvertimePopup, GoalModal, BreakModal } from './TimerPopups';
import HistoryModal from './HistoryModal';

/** Header component with title and history toggle */
const TimerHeader = ({ onOpenHistory }) => (
    <div className={styles.header}>
        <div className={styles.title}>Study Timer</div>
        <button className={styles.historyButton} onClick={onOpenHistory} aria-label="History">
            History 📜
        </button>
    </div>
);

/** Main timer UI layout including visuals, controls, and settings */
export const MainSection = ({ t, onOpenHistory }) => (
    <>
        <TimerHeader onOpenHistory={onOpenHistory} />
        <TreeAnimation progress={t.progress} mode={t.mode} />
        <ModeIndicator mode={t.mode} isOvertime={t.isOvertime} isBreakOvertime={t.isBreakOvertime} />
        <SessionStatus current={t.completedSessions} total={t.targetSessions} />
        <TimerDisplay timeLeft={t.timeLeft} mode={t.mode} isOvertime={t.isOvertime || t.isBreakOvertime} />
        <TimerControls isActive={t.isActive} onToggle={() => t.setIsActive(!t.isActive)} onReset={t.resetTimer} />
        <TimerSettings work={t.workTime} breakTime={t.breakTime} sessions={t.targetSessions} onUpdate={t.updateTime} isActive={t.isActive} />
    </>
);

/** Container for all timerrelated modals and popups */
export const PopupSection = ({ t, showHistory, onCloseHistory }) => (
    <>
        {showHistory && <HistoryModal onClose={onCloseHistory} />}
        {t.isOvertime && <OvertimePopup mode="work" time={t.timeLeft} onAction={t.handlers.break} />}
        {t.isBreakOvertime && <OvertimePopup mode="break" time={t.timeLeft} onAction={t.handlers.overtimeBreak} />}
        {t.modal === 'break' && <BreakModal onAction={t.handlers.break} />}
        {t.modal === 'goal' && <GoalModal sessions={t.completedSessions} workTime={t.totalWork} breakTime={t.totalBreak} onAction={t.handlers.goal} />}
    </>
);
