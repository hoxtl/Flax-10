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

/** Format seconds → "45m" or "1h 20m" */
function fmtDuration(sec) {
    if (sec <= 0) return '0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

/** Visual session progress dots */
function SessionDots({ completedSessions, targetSessions, isActive, isPaused }) {
    return (
        <div className={styles.sessionDots} aria-label={`Session ${completedSessions + 1} of ${targetSessions}`}>
            {Array.from({ length: targetSessions }).map((_, i) => {
                const isDone = i < completedSessions;
                const isCurrentActive = i === completedSessions && (isActive || isPaused);
                const cls = isDone
                    ? styles.sessionDotDone
                    : isCurrentActive
                        ? styles.sessionDotActive
                        : styles.sessionDotPending;
                return <span key={i} className={`${styles.sessionDot} ${cls}`} />;
            })}
        </div>
    );
}

/** Accumulating focus/break stats row — shows placeholders once timer started */
function LiveStatsRow({ blockTotalWork, blockTotalBreak, totalPaused, distractions, isActive, isPaused, onDistract }) {
    const everStarted = isActive || isPaused || blockTotalWork > 0 || blockTotalBreak > 0;
    if (!everStarted) return null;
    return (
        <div className={styles.liveStatsRow}>
            <span className={styles.liveStat}>🔥 <strong>{blockTotalWork > 0 ? fmtDuration(blockTotalWork) : '—'}</strong> focus</span>
            <span className={styles.liveStat}>☕ <strong>{blockTotalBreak > 0 ? fmtDuration(blockTotalBreak) : '—'}</strong> break</span>
            {totalPaused > 30 && <span className={styles.liveStat}>⏸ <strong>{fmtDuration(totalPaused)}</strong> paused</span>}
            {distractions > 0 && <span className={styles.liveStat}>⚡ <strong>{distractions}</strong> distraction{distractions !== 1 ? 's' : ''}</span>}
            {isActive && !isPaused && (
                <button className={styles.distractChip} onClick={onDistract}>+ distracted</button>
            )}
        </div>
    );
}

/** Block summary card with SVG progress ring — horizontal layout */
function BlockStatsCard({ completedSessions, targetSessions, blockTotalWork, blockTotalBreak }) {
    const radius = 22;
    const circ = 2 * Math.PI * radius;
    const pct = targetSessions > 0 ? completedSessions / targetSessions : 0;
    const dash = Math.min(pct, 1) * circ;

    return (
        <div className={styles.timerBlockStatsCard}>
            <span className={styles.blockStatsLabel}>THIS BLOCK</span>
            <div className={styles.blockStatsBody}>
                <div className={styles.blockRingWrap}>
                    <svg width="56" height="56" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--border)" strokeWidth="5" />
                        <circle
                            cx="28" cy="28" r={radius}
                            fill="none"
                            stroke={pct >= 1 ? 'var(--sage)' : 'var(--primary)'}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${dash} ${circ - dash}`}
                            strokeDashoffset={circ * 0.25}
                            style={{ transition: 'stroke-dasharray 0.6s ease' }}
                        />
                    </svg>
                    <div className={styles.blockRingInner}>
                        <span className={styles.blockRingValue}>{completedSessions}</span>
                        <span className={styles.blockRingDenom}>/{targetSessions}</span>
                    </div>
                </div>
                <div className={styles.blockStatRows}>
                    <div className={styles.blockStatRow}>
                        <span className={styles.blockStatKey}>Focus</span>
                        <span className={styles.blockStatVal}>{blockTotalWork > 0 ? fmtDuration(blockTotalWork) : '—'}</span>
                    </div>
                    <div className={styles.blockStatRow}>
                        <span className={styles.blockStatKey}>Break</span>
                        <span className={styles.blockStatVal}>{blockTotalBreak > 0 ? fmtDuration(blockTotalBreak) : '—'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Technique Presets ─────────────────────────────────── */

const BUILT_IN_PRESETS = [
    { id: 'pomodoro',  label: '🍅 Pomodoro',  work: 25, brk: 5,  sessions: 4 },
    { id: '5217',      label: '⚡ 52/17',      work: 52, brk: 17, sessions: 3 },
    { id: 'ultradian', label: '🧠 Ultradian',  work: 90, brk: 20, sessions: 2 },
    { id: 'deepwork',  label: '🎯 Deep Work',  work: 60, brk: 10, sessions: 3 },
    { id: 'sprint',    label: '🏃 Sprint',     work: 15, brk: 3,  sessions: 4 },
    { id: 'evening',   label: '🌙 Evening',    work: 45, brk: 15, sessions: 2 },
];

const CUSTOM_PRESETS_KEY = 'timerCustomPresets';
const AUTOSTART_KEY = 'timerAutoStart';

function loadCustomPresets() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) || '[]'); } catch { return []; }
}

function saveCustomPresets(presets) {
    try { localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets)); } catch {}
}

function isPresetActive(preset, t) {
    return t.workTime === preset.work && t.breakTime === preset.brk && t.targetSessions === preset.sessions;
}

function applyPreset(preset, t) {
    t.updateTime('work', preset.work);
    t.updateTime('break', preset.brk);
    t.updateTime('sessions', preset.sessions);
}

function PresetCard({ preset, t, onDelete }) {
    const active = isPresetActive(preset, t);
    const disabled = t.isActive;
    return (
        <div className={styles.presetListItemWrap}>
            <button
                className={`${styles.presetListItem} ${active ? styles.presetListItemActive : ''} ${disabled ? styles.presetListItemDisabled : ''}`}
                onClick={() => !disabled && applyPreset(preset, t)}
                disabled={disabled}
                title={`${preset.work}m work · ${preset.brk}m break · ${preset.sessions} sessions`}
            >
                <span className={styles.presetListItemName}>{preset.label}</span>
                <span className={styles.presetListItemMeta}>{preset.work}m · {preset.brk}m · {preset.sessions}×</span>
            </button>
            {onDelete && (
                <button className={styles.presetDeleteBtn} onClick={onDelete} title="Delete preset" aria-label="Delete preset">✕</button>
            )}
        </div>
    );
}

/** Daily goal mini-widget — lives inside PresetPanel */
function DailyGoalWidget() {
    const [goalHours, setGoalHours] = useState(() =>
        parseFloat(localStorage.getItem('timerDailyGoalHours') || '4'));
    const [studiedHours, setStudiedHours] = useState(null);
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState('');

    useEffect(() => {
        import('../../api/analyticsService').then(m => {
            m.default.getSummary(1)
                .then(res => setStudiedHours(res?.summary?.total_study_hours ?? 0))
                .catch(() => setStudiedHours(0));
        });
    }, []);

    const pct = Math.min(100, goalHours > 0 && studiedHours !== null
        ? Math.round((studiedHours / goalHours) * 100) : 0);

    const commitGoal = (val) => {
        const n = parseFloat(val);
        if (!isNaN(n) && n > 0) {
            setGoalHours(n);
            try { localStorage.setItem('timerDailyGoalHours', String(n)); } catch {}
        }
        setEditingGoal(false);
    };

    return (
        <div className={styles.dailyGoalWidget}>
            <div className={styles.dailyGoalHeader}>
                <span className={styles.dailyGoalLabel}>Today's Goal</span>
                {editingGoal ? (
                    <input
                        className={styles.todayGoalInput}
                        type="number"
                        min={0.5} max={24} step={0.5}
                        value={goalInput}
                        autoFocus
                        onChange={e => setGoalInput(e.target.value)}
                        onBlur={() => commitGoal(goalInput)}
                        onKeyDown={e => { if (e.key === 'Enter') commitGoal(goalInput); if (e.key === 'Escape') setEditingGoal(false); }}
                    />
                ) : (
                    <button className={styles.todayGoalEditBtn} onClick={() => { setGoalInput(String(goalHours)); setEditingGoal(true); }}>
                        {goalHours}h
                    </button>
                )}
            </div>
            <div className={styles.todayGoalBar}>
                <div className={styles.todayGoalFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.dailyGoalProgress}>
                {studiedHours !== null
                    ? `${fmtDuration(Math.round((studiedHours || 0) * 3600))} of ${goalHours}h (${pct}%)`
                    : '…'}
            </span>
        </div>
    );
}

/** Auto-start toggle */
function AutoStartToggle() {
    const [autoStart, setAutoStart] = useState(() =>
        localStorage.getItem(AUTOSTART_KEY) === 'true');
    return (
        <label className={styles.autoStartToggle}>
            <input
                type="checkbox"
                checked={autoStart}
                onChange={e => {
                    setAutoStart(e.target.checked);
                    try { localStorage.setItem(AUTOSTART_KEY, String(e.target.checked)); } catch {}
                }}
            />
            Auto-start next session
        </label>
    );
}

function PresetPanel({ t }) {
    const [customPresets, setCustomPresets] = useState(() => loadCustomPresets());
    const [saving, setSaving] = useState(false);
    const [saveName, setSaveName] = useState('');

    const handleSave = () => {
        const name = saveName.trim();
        if (!name) return;
        const newPreset = {
            id: `custom_${Date.now()}`,
            label: name,
            work: t.workTime,
            brk: t.breakTime,
            sessions: t.targetSessions,
        };
        const updated = [...customPresets, newPreset];
        setCustomPresets(updated);
        saveCustomPresets(updated);
        setSaving(false);
        setSaveName('');
    };

    const handleDelete = (id) => {
        const updated = customPresets.filter(p => p.id !== id);
        setCustomPresets(updated);
        saveCustomPresets(updated);
    };

    return (
        <div className={styles.presetPanelCard}>
            <span className={styles.presetPanelLabel}>Quick Start</span>
            <div className={styles.presetList}>
                {BUILT_IN_PRESETS.map(p => <PresetCard key={p.id} preset={p} t={t} />)}
                {customPresets.map(p => (
                    <PresetCard key={p.id} preset={p} t={t} onDelete={() => handleDelete(p.id)} />
                ))}
            </div>
            <div className={styles.presetSaveArea}>
                {saving ? (
                    <div className={styles.presetSaveForm}>
                        <input
                            className={styles.presetNameInput}
                            placeholder="Preset name…"
                            value={saveName}
                            onChange={e => setSaveName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaving(false); }}
                            autoFocus
                            maxLength={24}
                        />
                        <button className={styles.presetSaveConfirm} onClick={handleSave}>Save</button>
                        <button className={styles.presetSaveCancel} onClick={() => setSaving(false)}>Cancel</button>
                    </div>
                ) : (
                    <button className={styles.presetSaveBtn} onClick={() => { setSaving(true); setSaveName(''); }} disabled={t.isActive}>
                        + Save current
                    </button>
                )}
            </div>
            <div className={styles.presetGoalDivider} />
            <DailyGoalWidget />
        </div>
    );
}

/* ── Milestone Card ─────────────────────────────────────── */

function MilestoneCard() {
    const [summary, setSummary] = useState(null);
    useEffect(() => {
        import('../../api/analyticsService').then(m =>
            m.default.getSummary(30).then(r => setSummary(r?.summary)).catch(() => {})
        );
    }, []);

    if (!summary) return null;
    const totalSessions = summary.total_sessions ?? 0;
    const streakDays = summary.current_streak_days ?? 0;
    const totalHours = summary.total_study_hours ?? 0;
    const milestone = getNearestMilestone(totalSessions, streakDays, totalHours);
    const pct = milestone ? Math.min(100, Math.round((milestone.current / milestone.target) * 100)) : 100;

    return (
        <div className={styles.milestoneCard}>
            <span className={styles.milestoneLabel}>NEXT MILESTONE</span>
            {milestone ? (
                <>
                    <span className={styles.milestoneNextText}>
                        {milestone.remaining === 1
                            ? `1 more to reach ${milestone.label}!`
                            : `${Math.round(milestone.remaining * 10) / 10} away from ${milestone.label}`}
                    </span>
                    <div className={styles.milestoneBar}>
                        <div className={styles.milestoneFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.milestoneMeta}>{Math.round(milestone.current * 10) / 10} / {milestone.target}</span>
                </>
            ) : (
                <span className={styles.milestoneNextText}>All milestones reached! 🏆</span>
            )}
        </div>
    );
}

/* ── Circular Timer Ring ────────────────────────────────── */

function TimerRing({ t }) {
    const radius = 90;
    const circ = 2 * Math.PI * radius;
    const total = (t.mode === 'work' ? t.workTime : t.breakTime) * 60;
    const ratio = total > 0 ? Math.max(0, t.timeLeft / total) : 1;
    const dash = ratio * circ;
    const isOvertime = t.isOvertime || t.isBreakOvertime;
    const color = isOvertime ? '#f59e0b' : t.mode === 'break' ? 'var(--sage)' : 'var(--primary)';

    return (
        <div className={styles.timerRingWrap}>
            <svg className={styles.timerRingSvg} viewBox="0 0 220 220" aria-hidden="true">
                <circle cx="110" cy="110" r={radius} fill="none" stroke="var(--border)" strokeWidth="5" />
                <circle
                    cx="110" cy="110" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={circ * 0.25}
                    style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s ease' }}
                />
            </svg>
            <div className={styles.timerRingContent}>
                <TimerDisplay timeLeft={t.timeLeft} mode={t.mode} isOvertime={isOvertime} />
            </div>
        </div>
    );
}

/* ── Session Pace Indicator ─────────────────────────────── */

function PaceIndicator({ completedSessions, targetSessions }) {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    const elapsed = Math.max(0, Math.min(1, (h - 8) / 14)); // 8am–10pm window
    if (elapsed < 0.1 || targetSessions === 0) return null;
    const expected = Math.round(elapsed * targetSessions);
    const diff = completedSessions - expected;
    const { text, cls } = diff >= 1
        ? { text: '🚀 Ahead of pace', cls: styles.paceAhead }
        : diff >= 0
            ? { text: '✓ On track', cls: styles.paceOnTrack }
            : { text: `${-diff} session${-diff > 1 ? 's' : ''} behind`, cls: styles.paceBehind };
    return <div className={`${styles.paceIndicator} ${cls}`}>{text}</div>;
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
