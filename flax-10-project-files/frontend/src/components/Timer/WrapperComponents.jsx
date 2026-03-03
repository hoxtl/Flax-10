import styles from "../../pages/Timer/TimerPage.module.css";
import TreeAnimation from './TreeAnimation';
import { TimerDisplay, ModeIndicator, SessionStatus, TimerControls, TimerSettings, SoundSelector, TaskInput } from './TimerComponents';
import { OvertimePopup, GoalModal, BreakModal } from './TimerPopups';
import HistoryModal from './HistoryModal';

/** Header component with title and history toggle */
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

/** Main timer UI layout including visuals, controls, and settings */
export const MainSection = ({ t, onOpenHistory, isMobile }) => (
    <>
        <TimerHeader onOpenHistory={onOpenHistory} isMobile={isMobile} />
        <TaskInput value={t.task} onChange={t.setTask} />

        {isMobile && (
            <button className={styles.mobileHistoryBtn} onClick={onOpenHistory}>
                View History 📜
            </button>
        )}

        <TreeAnimation progress={t.progress} mode={t.mode} />

        <ModeIndicator mode={t.mode} isOvertime={t.isOvertime} isBreakOvertime={t.isBreakOvertime} />
        <SessionStatus current={t.completedSessions} total={t.targetSessions} />
        <TimerDisplay timeLeft={t.timeLeft} mode={t.mode} isOvertime={t.isOvertime || t.isBreakOvertime} />
        <TimerControls
            isActive={t.isActive}
            isPaused={t.isPaused}
            onToggle={() => t.setIsActive(true)}
            onPause={t.togglePause}
            onReset={t.resetTimer}
            totalPaused={t.totalPaused}
        />
        <TimerSettings work={t.workTime} breakTime={t.breakTime} sessions={t.targetSessions} onUpdate={t.updateTime} isActive={t.isActive} />
        <SoundSelector />
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
