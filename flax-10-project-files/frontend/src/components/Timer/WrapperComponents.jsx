import { useCallback, useEffect, useState } from "react";
import styles from "../../pages/Timer/TimerPage.module.css";
import { OvertimePopup, GoalModal, BreakModal, EndEarlyModal, BreakStartedPopup } from './TimerPopups';
import HistoryModal from './HistoryModal';
import Tabs from '../common/Tabs/Tabs';
import { rankTasksForFocus } from '../../lib/focusPlanner';
import { getHistory } from './utils/historyUtils';
import { AUTOSTART_KEY, applyTaskToTimer } from './utils/presetUtils';
import { formatSessionMinutes, extractTime, isToday } from './utils/timerFormatters';
import SessionDots, { LiveStatsRow, ProgressStrip } from './SessionDots';
import TimerCircle, { TimerRing } from './TimerCircle';
import { TimerControls, ModeIndicator } from './TimerComponents';
import { PresetPanel, TimerConfigPanel } from './PresetPanel';
import InlineSoundPanel from './InlineSoundPanel';
import RightRailHistoryPanel from './RightRailHistoryPanel';
import { TaskInput } from './TaskInput';

function estimatedFinishTime(t) {
    const remaining = t.targetSessions - t.completedSessions;
    if (remaining <= 0) return null;
    const sessionSec = t.workTime * 60 + t.breakTime * 60;
    const totalSec = (t.isActive || t.isPaused)
        ? Math.max(t.timeLeft, 0) + (remaining - 1) * sessionSec
        : remaining * sessionSec;
    const at = new Date(Date.now() + totalSec * 1000);
    return at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

const TimerTopSection = ({ t, onOpenFocus }) => {
    useEffect(() => {
        try {
            const suggested = sessionStorage.getItem('timerSuggestedTask');
            if (suggested && typeof t.setTask === 'function') {
                t.setTask(suggested);
                sessionStorage.removeItem('timerSuggestedTask');
            }
        } catch {}
    }, [t]);

    const handleJustStart = useCallback(async () => {
        const title = (t.task || '').trim();
        if (title) { t.setIsActive(true); return; }
        try {
            const { fetchTasks } = await import('../../api/taskService');
            const tasks = await fetchTasks({ completed: false });
            const open = Array.isArray(tasks) ? tasks.filter(task => !task.completed && !task.archived) : [];
            const ranked = rankTasksForFocus(open);
            if (ranked.length > 0) { applyTaskToTimer(ranked[0], t); return; }
        } catch {}
        t.setIsActive(true);
    }, [t]);

    return (
        <TaskInput
            value={t.task}
            onChange={t.setTask}
            onClearTask={() => { if (typeof t.setActiveTaskId === 'function') t.setActiveTaskId(null); }}
            onTaskSelect={(task) => applyTaskToTimer(task, t)}
            onJustStart={handleJustStart}
            isSessionActive={Boolean(t.isActive || t.isPaused)}
            onOpenFocus={onOpenFocus}
        />
    );
};

const TimerInfoSection = ({ t, onPrimaryStart }) => {
    const finishAt = estimatedFinishTime(t);
    return (
        <>
            <ProgressStrip value={t.progress} />
            <SessionDots completedSessions={t.completedSessions} targetSessions={t.targetSessions} isActive={t.isActive} isPaused={t.isPaused} />
            <ModeIndicator mode={t.mode} isOvertime={t.isOvertime} isBreakOvertime={t.isBreakOvertime} />
            {finishAt && <div className={styles.estimatedFinish}>~Done by {finishAt}</div>}
            <TimerRing t={t} />
            <TimerControls
                isActive={t.isActive} isPaused={t.isPaused}
                onToggle={onPrimaryStart} onPause={t.togglePause}
                onReset={t.resetTimer} onEndEarly={() => t.setModal('endEarly')}
                totalPaused={t.totalPaused}
            />
        </>
    );
};

export const MainSection = ({ t, onOpenHistory, onOpenFocus, isMobile }) => {
    const startManualTask = useCallback(() => {
        const title = (t.task || '').trim();
        if (!title) { t.setIsActive(true); return; }
        if (t.setActiveTaskId) {
            t.setActiveTaskId(null, {
                title,
                moduleCode: t.activeTaskMeta?.moduleCode || null,
                dueDate: t.activeTaskMeta?.dueDate || null,
                listName: t.activeTaskMeta?.listName || 'Quick task',
                estimatedBlocks: Number(t.activeTaskMeta?.estimatedBlocks || 1),
                estimatedSessionCount: Number(t.targetSessions || 1),
                estimatedWorkMinutes: Number(t.workTime || 25),
            });
        }
        t.setIsActive(true);
    }, [t]);

    return (
        <div className={styles.timerMainCard}>
            <TimerTopSection t={t} onOpenFocus={onOpenFocus} />
            <TimerInfoSection t={t} onPrimaryStart={startManualTask} />
            <LiveStatsRow
                blockTotalWork={t.blockTotalWork} blockTotalBreak={t.blockTotalBreak}
                totalPaused={t.totalPaused} distractions={t.distractionCount}
                isActive={t.isActive} isPaused={t.isPaused} onDistract={t.addDistraction}
            />
            {isMobile && <button className={styles.mobileHistoryBtn} onClick={onOpenHistory}>View History 📜</button>}
        </div>
    );
};

function RightRailTabs({ t }) {
    const [tab, setTab] = useState('presets');
    const tabs = [
        { id: 'presets',  label: 'Presets',        content: <PresetPanel t={t} embedded /> },
        { id: 'config',   label: 'Configuration',  content: <TimerConfigPanel t={t} embedded /> },
        { id: 'history',  label: 'History',         content: <RightRailHistoryPanel /> },
    ];
    return (
        <div className={styles.presetPanelCard}>
            <Tabs tabs={tabs} activeTab={tab} onTabChange={setTab} layoutId="timerRightRailTab" tabVariant="heading" />
        </div>
    );
}

export const RightPanel = ({ t }) => (
    <div className={styles.timerRightPanel}>
        <RightRailTabs t={t} />
        <InlineSoundPanel />
    </div>
);

export const PopupSection = ({ t, showHistory, onCloseHistory }) => {
    useEffect(() => {
        if (t.modal !== 'break') return;
        if (localStorage.getItem(AUTOSTART_KEY) !== 'true') return;
        const id = setTimeout(() => t.handlers.break(), 2000);
        return () => clearTimeout(id);
    }, [t.modal, t.handlers]);

    useEffect(() => {
        if (t.modal !== 'autoBreak' || !t.isActive || t.timeLeft > 0) return;
        const id = setTimeout(() => t.handlers.autoBreakDone(), 250);
        return () => clearTimeout(id);
    }, [t.modal, t.isActive, t.timeLeft, t.handlers]);

    const autoStart = typeof localStorage !== 'undefined' && localStorage.getItem(AUTOSTART_KEY) === 'true';
    const isLastSession = (t.completedSessions + 1) >= t.targetSessions;
    const currentGoalSec = Math.max(60, Number((t.mode === 'break' ? t.breakTime : t.workTime) || 25) * 60);
    const currentElapsedSec = Math.max(0, currentGoalSec - Math.max(0, Number(t.timeLeft || 0)));

    return (
        <>
            {showHistory && <HistoryModal onClose={onCloseHistory} />}
            {t.modal === 'autoBreak' && <BreakStartedPopup time={t.timeLeft} onAction={t.handlers.autoBreakDone} />}
            {t.isOvertime && <OvertimePopup mode="work" time={t.timeLeft} onAction={t.handlers.break} isLastSession={isLastSession} />}
            {t.isBreakOvertime && <OvertimePopup mode="break" time={t.timeLeft} onAction={t.handlers.overtimeBreak} />}
            {t.modal === 'break' && !autoStart && <BreakModal onAction={t.handlers.break} isLastSession={isLastSession} />}
            {t.modal === 'goal' && <GoalModal sessions={t.completedSessions} workTime={t.blockTotalWork} breakTime={t.blockTotalBreak} onAction={t.handlers.goal} distractionCount={t.distractionCount} />}
            {t.modal === 'endEarly' && <EndEarlyModal onConfirm={t.handlers.endEarly} onCancel={() => t.setModal(null)} elapsedSeconds={currentElapsedSec} goalSeconds={currentGoalSec} />}
        </>
    );
};

export const FocusOverlayContent = ({ t, onExitFocus }) => (
    <>
        <button className={styles.focusOverlayClose} onClick={onExitFocus}>✕ Exit focus</button>
        <TimerCircle t={t} />
    </>
);

export const SessionLogTable = () => {
    const [rows, setRows] = useState([]);

    const refreshHistory = async () => {
        try {
            const data = await getHistory();
            const today = Array.isArray(data) ? data.filter(r => isToday(r.start_time || r.startTime || r.date || r.end_time || r.endTime)) : [];
            setRows(today.sort((a, b) => {
                const aT = extractTime(a.start_time || a.startTime || a.date);
                const bT = extractTime(b.start_time || b.startTime || b.date);
                if (!aT || !bT) return 0;
                return bT - aT;
            }));
        } catch { setRows([]); }
    };

    useEffect(() => {
        refreshHistory();
        window.addEventListener('timerHistoryUpdated', refreshHistory);
        window.addEventListener('historyCleared', refreshHistory);
        return () => {
            window.removeEventListener('timerHistoryUpdated', refreshHistory);
            window.removeEventListener('historyCleared', refreshHistory);
        };
    }, []);

    return (
        <div className={styles.sessionLogCard}>
            <div className={styles.sessionLogHeader}>Today's Sessions</div>
            {rows.length > 0 ? (
                <table className={styles.sessionLogTable}>
                    <thead><tr><th>Time</th><th>Duration</th><th>Module / Task</th><th>Status</th></tr></thead>
                    <tbody>
                        {rows.map((r, idx) => {
                            const start = extractTime(r.start_time || r.startTime || r.date);
                            const task = r.task || 'Break';
                            const moduleName = r.module || r.module_code || r.moduleCode;
                            return (
                                <tr key={r.id ?? `${task}-${idx}`}>
                                    <td>{start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                    <td>{formatSessionMinutes(r.duration ?? 0)}</td>
                                    <td>{moduleName ? `${task} · ${moduleName}` : task}</td>
                                    <td>{r.status || 'Completed'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <div className={styles.sessionLogEmpty}>No completed sessions yet today.</div>
            )}
        </div>
    );
};
