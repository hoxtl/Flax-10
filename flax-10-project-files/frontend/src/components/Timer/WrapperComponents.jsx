import { useCallback, useEffect } from "react";

import TreeAnimation from './TreeAnimation';
import { TimerDisplay, ModeIndicator, SessionStatus, TimerControls, TimerSettings, SoundSelector, TaskInput } from './TimerComponents';
import { OvertimePopup, GoalModal, BreakModal } from './TimerPopups';
import HistoryModal from './HistoryModal';

import styles from "../../pages/Timer/TimerPage.module.css";

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
export const MainSection = ({ t, onOpenHistory }) => {
    const handleTaskSelect = useCallback((task) => {
        t.setTask(task.title);
        const mins = (task.estimated_blocks || 1) * 25;
        t.updateTime('work', mins);
        t.setTimeLeft(mins * 60);
        t.setIsActive(true);
        if (task.list_color != null) t.setSelectedTaskColor(task.list_color);
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

    return (
        <>
            <TimerHeader onOpenHistory={onOpenHistory} />
            <TaskInput value={t.task} onChange={t.setTask} onTaskSelect={handleTaskSelect} />
            <TreeAnimation progress={t.progress} mode={t.mode} />
            <ModeIndicator mode={t.mode} isOvertime={t.isOvertime} isBreakOvertime={t.isBreakOvertime} isActive={t.isActive} timeLeft={t.timeLeft} workTime={t.workTime} />
            <SessionStatus current={t.completedSessions} total={t.targetSessions} />
            <TimerDisplay timeLeft={t.timeLeft} mode={t.mode} isOvertime={t.isOvertime || t.isBreakOvertime} />
            <TimerControls isActive={t.isActive} onToggle={() => t.setIsActive(!t.isActive)} onReset={t.resetTimer} timeLeft={t.timeLeft} task={t.task} workTime={t.workTime} />
            <TimerSettings work={t.workTime} breakTime={t.breakTime} sessions={t.targetSessions} onUpdate={t.updateTime} isActive={t.isActive} />
            <SoundSelector />
        </>
    );
};

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
