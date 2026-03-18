import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../../pages/Timer/TimerPage.module.css";
import historyStyles from './HistoryModal.module.css';
import FocusAnimation from './FocusAnimation';
import { getNearestMilestone } from './utils/milestoneUtils';
import { TimerDisplay, TimerSettings, useAmbientSound, TaskInput } from './TimerComponents';
import { OvertimePopup, GoalModal, BreakModal, EndEarlyModal, BreakStartedPopup } from './TimerPopups';
import HistoryModal from './HistoryModal';
import Tabs from '../common/Tabs/Tabs';
import BackButton from '../common/BackButton/BackButton.jsx';
import PrimaryButton from '../common/PrimaryButton/PrimaryButton';
import StandardModal from '../common/StandardModal/StandardModal';
import HoldConfirmModal from '../common/HoldConfirmModal/HoldConfirmModal';
import { splitEstimatedBlocks } from '../../lib/focusPlanner';
import { rankTasksForFocus } from '../../lib/focusPlanner';
import { getHistory, clearHistory } from './utils/historyUtils';
import { groupHistoryByBlock, formatTimeRange, formatDuration } from './utils/historyFormatter';

/** Format seconds → "45m" or "1h 20m" */
function fmtDuration(sec) {
    if (sec <= 0) return '0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

function formatHoursAsClock(hours) {
    const totalSeconds = Math.max(0, Math.round(Number(hours || 0) * 3600));
    const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

/** Visual session progress dots */
function SessionDots({ completedSessions, targetSessions, isActive, isPaused }) {
    const iconCls = styles.sessionDotCheckmark;
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
                const label = isDone ? "✓" : (isCurrentActive ? String(i + 1) : '');
                return (
                    <span key={i} className={`${styles.sessionDot} ${cls}`} aria-hidden={!isDone}>
                        {isDone ? <span className={iconCls}>{label}</span> : null}
                    </span>
                );
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

function ProgressStrip({ value }) {
    return (
        <div className={styles.linearProgressWrap}>
            <div className={styles.linearProgressBar}>
                <span className={styles.linearProgressFill} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
            </div>
        </div>
    );
}

/** Block summary card with SVG progress ring — horizontal layout */
function BlockStatsCard({ completedSessions, targetSessions, blockTotalWork, blockTotalBreak, className = '' }) {
    const radius = 22;
    const circ = 2 * Math.PI * radius;
    const pct = targetSessions > 0 ? completedSessions / targetSessions : 0;
    const dash = Math.min(pct, 1) * circ;

    return (
        <div className={`${styles.timerBlockStatsCard} ${className}`}>
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
    { id: 'pomodoro',  label: 'Pomodoro', work: 25, brk: 5,  sessions: 4 },
    { id: '5217',      label: '52/17',    work: 52, brk: 17, sessions: 3 },
    { id: 'ultradian', label: 'Ultradian', work: 90, brk: 20, sessions: 2 },
    { id: 'deepwork',  label: 'Deep Work', work: 60, brk: 10, sessions: 3 },
    { id: 'sprint',    label: 'Sprint',    work: 15, brk: 3,  sessions: 4 },
    { id: 'evening',   label: 'Evening',   work: 45, brk: 15, sessions: 2 },
];

const CUSTOM_PRESETS_KEY = 'timerCustomPresets';
const AUTOSTART_KEY = 'timerAutoStart';
const PRESET_USAGE_KEY = 'timerPresetUsage';

function inferTaskType(title = '') {
    const text = String(title || '').toLowerCase();
    if (/(lab|report|code|project|thesis|dissertation|build)/.test(text)) return 'lab';
    if (/(problem|exercise|worksheet|practice|quiz|pset|questions)/.test(text)) return 'problem';
    if (/(read|chapter|paper|article|review|notes|lecture|literature)/.test(text)) return 'reading';
    return 'general';
}

function loadCustomPresets() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) || '[]'); } catch { return []; }
}

function saveCustomPresets(presets) {
    try { localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets)); } catch {}
}

function loadPresetUsage() {
    try { return JSON.parse(localStorage.getItem(PRESET_USAGE_KEY) || '{}'); } catch { return {}; }
}

function savePresetUsage(data) {
    try { localStorage.setItem(PRESET_USAGE_KEY, JSON.stringify(data)); } catch {}
}

function suggestPresetForTask(taskTitle, usageMap = {}) {
    const type = inferTaskType(taskTitle);
    if (type === 'reading') return BUILT_IN_PRESETS.find((p) => p.id === 'pomodoro');
    if (type === 'problem') return BUILT_IN_PRESETS.find((p) => p.id === '5217');
    if (type === 'lab') return BUILT_IN_PRESETS.find((p) => p.id === 'deepwork');

    const rankedByUsage = [...BUILT_IN_PRESETS]
        .sort((a, b) => Number(usageMap[b.id] || 0) - Number(usageMap[a.id] || 0));
    return rankedByUsage[0] || BUILT_IN_PRESETS[0];
}

function isPresetActive(preset, t) {
    return t.workTime === preset.work && t.breakTime === preset.brk && t.targetSessions === preset.sessions;
}

function applyPreset(preset, t) {
    t.updateTime('work', preset.work);
    t.updateTime('break', preset.brk);
    t.updateTime('sessions', preset.sessions);
}

function getPresetIcon(preset) {
    const id = String(preset?.id || '');
    if (id === 'pomodoro') return '⏱️';
    if (id === '5217') return '🌊';
    if (id === 'ultradian') return '🧠';
    if (id === 'deepwork') return '🎯';
    if (id === 'sprint') return '⚡';
    if (id === 'evening') return '🌙';
    if (id.startsWith('custom_')) return '⚙️';
    return '⚙️';
}

function getPresetDurationTag(preset) {
    return `${preset.work}/${preset.brk}`;
}

function applyTaskToTimer(task, t) {
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
            moduleCode: task.module_code || null,
            dueDate: task.due_date || null,
            listName: task.list_name || null,
            taskType: inferTaskType(task.title),
            estimatedBlocks: Number(task.estimated_blocks || 1),
            estimatedSessionCount: split.sessionCount,
            estimatedWorkMinutes: split.workMinutes,
        });
    }
    try { sessionStorage.setItem('timerTaskId', String(task.id)); } catch (_) {}
}

function PresetCard({ preset, t, onApply, onDelete }) {
    const [ctxMenu, setCtxMenu] = useState(null);
    const ctxRef = useRef(null);
    const active = isPresetActive(preset, t);
    const disabled = t.isActive;
    const icon = getPresetIcon(preset);
    const durationTag = getPresetDurationTag(preset);

    useEffect(() => {
        if (!ctxMenu) return;
        const handler = (e) => { if (ctxRef.current && !ctxRef.current.contains(e.target)) setCtxMenu(null); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ctxMenu]);

    const handleContextMenu = (e) => {
        if (!onDelete) return;
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    };

    const tooltipText = `${preset.work}m work · ${preset.brk}m break · ${preset.sessions} sessions`;

    return (
        <div className={styles.presetListItemWrap} onContextMenu={handleContextMenu} data-tooltip={tooltipText}>
            <button
                className={`${styles.presetListItem} ${active ? styles.presetListItemActive : ''} ${disabled ? styles.presetListItemDisabled : ''}`}
                onClick={() => !disabled && onApply?.(preset)}
                disabled={disabled}
            >
                <span className={styles.presetListItemTop}>
                    <span className={styles.presetListIcon} aria-hidden="true">{icon}</span>
                    <span className={styles.presetListItemName}>{preset.label}</span>
                    <span className={styles.presetDurationTag}>{durationTag}</span>
                </span>
                <span className={styles.presetListItemMeta}>{preset.sessions} sessions</span>
            </button>
            {onDelete && (
                <button className={styles.presetDeleteBtn} onClick={onDelete} title="Delete preset" aria-label="Delete preset">✕</button>
            )}
            {ctxMenu && onDelete && (
                <div ref={ctxRef} className={styles.presetCtxMenu} style={{ top: ctxMenu.y, left: ctxMenu.x, position: 'fixed' }}>
                    <button className={styles.presetCtxDeleteBtn} onClick={() => { onDelete(); setCtxMenu(null); }}>
                        🗑 Delete preset
                    </button>
                </div>
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

function PresetPanel({ t, embedded = false }) {
    const [customPresets, setCustomPresets] = useState(() => loadCustomPresets());
    const [usageMap, setUsageMap] = useState(() => loadPresetUsage());
    const [saving, setSaving] = useState(false);
    const [saveName, setSaveName] = useState('');

    const sortedPresets = [...BUILT_IN_PRESETS, ...customPresets].sort((a, b) => {
        const aUse = Number(usageMap[a.id] || 0);
        const bUse = Number(usageMap[b.id] || 0);
        if (aUse !== bUse) return bUse - aUse;
        return String(a.label).localeCompare(String(b.label));
    });

    const applyPresetAndTrack = (preset) => {
        applyPreset(preset, t);
        const next = { ...usageMap, [preset.id]: Number(usageMap[preset.id] || 0) + 1 };
        setUsageMap(next);
        savePresetUsage(next);
    };

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

    const content = (
        <>
            <div className={styles.presetPanelGrid}>
                {sortedPresets.map(p => (
                    <PresetCard
                        key={p.id}
                        preset={p}
                        t={t}
                        onApply={applyPresetAndTrack}
                        onDelete={customPresets.some((cp) => cp.id === p.id) ? () => handleDelete(p.id) : null}
                    />
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
        </>
    );

    if (embedded) return content;
    return <div className={styles.presetPanelCard}>{content}</div>;
}

function TimerConfigPanel({ t, embedded = false }) {
    const disabled = t.isActive || t.isPaused;
    const applyMinutes = (minutes) => {
        if (disabled) return;
        t.updateTime('work', minutes);
        t.setTimeLeft(minutes * 60);
    };
    const adjustMinutes = (delta) => {
        if (disabled) return;
        const next = Math.max(5, Number(t.workTime || 25) + delta);
        t.updateTime('work', next);
        t.setTimeLeft(next * 60);
    };

    const content = (
        <>
            <div className={styles.configInsetPanel}>
                <TimerSettings
                    work={t.workTime}
                    breakTime={t.breakTime}
                    sessions={t.targetSessions}
                    onUpdate={t.updateTime}
                />
                <div className={styles.quickAdjustRow}>
                    <button type="button" className={styles.quickAdjustBtn} onClick={() => adjustMinutes(-5)} disabled={disabled}>-5m</button>
                    <button type="button" className={styles.quickAdjustBtn} onClick={() => applyMinutes(25)} disabled={disabled}>25m</button>
                    <button type="button" className={styles.quickAdjustBtn} onClick={() => applyMinutes(50)} disabled={disabled}>50m</button>
                    <button type="button" className={styles.quickAdjustBtn} onClick={() => applyMinutes(90)} disabled={disabled}>90m</button>
                    <button type="button" className={styles.quickAdjustBtn} onClick={() => adjustMinutes(5)} disabled={disabled}>+5m</button>
                </div>
                <AutoStartToggle />
            </div>
        </>
    );

    if (embedded) return content;
    return <div className={styles.presetPanelCard}>{content}</div>;
}

function taskDueText(task, now = new Date()) {
    if (!task?.due_date) return null;
    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) return null;
    const diffMs = due.getTime() - now.getTime();
    const absMin = Math.abs(diffMs) / 60000;
    if (absMin < 5) return 'now';
    const days = Math.floor(absMin / (60 * 24));
    const hrs = Math.floor(absMin / 60);
    const mins = Math.round(absMin % 60);
    const remHrs = Math.floor((absMin - days * 24 * 60) / 60);
    if (diffMs < 0) {
        if (days > 0) return `${days}d ${remHrs}h overdue`;
        return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m overdue`;
    }
    if (days > 0) return `${days}d ${remHrs}h left`;
    if (hrs === 0) return `${mins}m left`;
    return `${hrs}h ${mins}m left`;
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
                            : `${milestone.remaining} away from ${milestone.label}`}
                    </span>
                    <div className={styles.milestoneBar}>
                        <div className={styles.milestoneFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.milestoneMeta}>{milestone.current} / {milestone.target}</span>
                </>
            ) : (
                <span className={styles.milestoneNextText}>All milestones reached! 🏆</span>
            )}
        </div>
    );
}

/* ── Big Timer Circle (animation + time + controls inside ring) ── */

function TimerCircle({ t, onPrimaryStart }) {
    const radius = 136;
    const circ = 2 * Math.PI * radius;
    const total = (t.mode === 'work' ? t.workTime : t.breakTime) * 60;
    const ratio = total > 0 ? Math.max(0, t.timeLeft / total) : 1;
    const dash = ratio * circ;
    const segmentUnit = circ / 32;
    const segmentDash = `${segmentUnit * 0.68} ${segmentUnit * 0.32}`;
    const isOvertime = t.isOvertime || t.isBreakOvertime;
    const color = isOvertime ? '#f59e0b' : t.mode === 'break' ? 'var(--sage)' : 'var(--focus-accent, var(--primary))';
    const label = !t.isActive ? 'Start' : (t.isPaused ? 'Resume' : 'Pause');
    const isRunning = t.isActive && !t.isPaused;
    const icon = !t.isActive ? '▶' : (t.isPaused ? '▶' : '❚❚');
    const deepFocusMode = t.workTime >= 60;
    const action = !t.isActive
        ? () => {
            if (onPrimaryStart) {
                onPrimaryStart();
                return;
            }
            t.setIsActive(true);
        }
        : t.togglePause;
    const activeClass = t.isActive && !t.isPaused ? styles.timerProgressActive : '';
    const wrapClass = `${styles.timerCircleWrap} ${isRunning ? styles.timerCircleActive : ''} ${isRunning && deepFocusMode ? styles.timerCircleDeep : ''}`;

    return (
        <div className={wrapClass}>
            <svg className={styles.timerRingSvg} viewBox="0 0 320 320" aria-hidden="true">
                <circle
                    cx="160"
                    cy="160"
                    r={radius}
                    fill="none"
                    stroke="color-mix(in srgb, var(--focus-accent, var(--primary)) 18%, var(--border))"
                    strokeWidth="12"
                    strokeDasharray={segmentDash}
                    strokeDashoffset={circ * 0.25}
                />
                <circle
                    cx="160" cy="160" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={circ * 0.25}
                    className={activeClass}
                    style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s ease' }}
                />
            </svg>
            <div className={styles.timerCircleContent}>
                <div className={styles.timerCircleAnimClip}>
                    <FocusAnimation progress={t.progress / 100} mode={t.mode} isActive={t.isActive} />
                </div>
                <TimerDisplay timeLeft={t.timeLeft} mode={t.mode} isOvertime={isOvertime} />
                <button
                    className={`${styles.timerCirclePrimaryBtn} ${isRunning ? styles.timerCirclePrimaryBtnRunning : ''}`}
                    onClick={action}
                >
                    <span className={styles.timerPrimaryIcon}>{icon}</span>
                    <span className={styles.timerPrimaryLabel}>{label}</span>
                </button>
                {(t.isActive || t.isPaused) && (
                    <div className={styles.timerCircleSecondaryBtns}>
                        <button className={styles.timerCircleSecondaryBtn} onClick={t.resetTimer}>Reset</button>
                        <button className={styles.timerCircleSecondaryBtn} onClick={() => t.setModal('endEarly')}>End Early</button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Circular Timer Ring (kept for focus overlay) ──────── */

function TimerRing({ t }) {
    const radius = 90;
    const circ = 2 * Math.PI * radius;
    const total = (t.mode === 'work' ? t.workTime : t.breakTime) * 60;
    const ratio = total > 0 ? Math.max(0, t.timeLeft / total) : 1;
    const dash = ratio * circ;
    const isOvertime = t.isOvertime || t.isBreakOvertime;
    const color = isOvertime ? '#f59e0b' : t.mode === 'break' ? 'var(--sage)' : 'var(--primary)';
    const activeClass = t.isActive && !t.isPaused ? styles.timerProgressActive : '';

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
                    className={activeClass}
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
            : { text: "Let's catch up - Quick 15m sprint?", cls: styles.paceBehind };
    return <div className={`${styles.paceIndicator} ${cls}`}>{text}</div>;
}

/* ── Composed sections ──────────────────────────────────── */

const TimerTopSection = ({ t, onOpenFocus }) => {
    useEffect(() => {
        try {
            const suggested = sessionStorage.getItem('timerSuggestedTask');
            if (suggested && typeof t.setTask === 'function') {
                t.setTask(suggested);
                sessionStorage.removeItem('timerSuggestedTask');
            }
        } catch (_) {}
    }, [t]);

    const handleJustStart = useCallback(async () => {
        const title = (t.task || '').trim();
        if (title) {
            t.setIsActive(true);
            return;
        }
        try {
            const { fetchTasks } = await import('../../api/taskService');
            const tasks = await fetchTasks({ completed: false });
            const open = Array.isArray(tasks) ? tasks.filter((task) => !task.completed && !task.archived) : [];
            const ranked = rankTasksForFocus(open);
            if (ranked.length > 0) {
                applyTaskToTimer(ranked[0], t);
                return;
            }
        } catch {}
        t.setIsActive(true);
    }, [t]);

    return (
        <TaskInput
            value={t.task}
            onChange={t.setTask}
            onClearTask={() => {
                if (typeof t.setActiveTaskId === 'function') t.setActiveTaskId(null);
            }}
            onTaskSelect={(task) => applyTaskToTimer(task, t)}
            onJustStart={handleJustStart}
            isSessionActive={Boolean(t.isActive || t.isPaused)}
            onOpenFocus={onOpenFocus}
        />
    );
};

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

const TimerInfoSection = ({ t, onPrimaryStart }) => {
    const finishAt = estimatedFinishTime(t);

    return (
        <>
            <ProgressStrip value={t.progress} />
            <TimerCircle t={t} onPrimaryStart={onPrimaryStart} />
            <SessionDots
                completedSessions={t.completedSessions}
                targetSessions={t.targetSessions}
                isActive={t.isActive}
                isPaused={t.isPaused}
            />
            {finishAt && <div className={styles.estimatedFinish}>~Done by {finishAt}</div>}
        </>
    );
};

function SelectedTaskCard({ t }) {
    const title = (t.task || '').trim();
    if (!title) return null;

    const dueText = taskDueText({ due_date: t.activeTaskMeta?.dueDate });
    const moduleCode = t.activeTaskMeta?.moduleCode || 'General';
    const listName = t.activeTaskMeta?.listName || 'Task';
    const sessionsLeft = Math.max(0, Number(t.targetSessions || 0) - Number(t.completedSessions || 0));
    const effort = t.activeTaskMeta?.estimatedWorkMinutes
        ? `${t.activeTaskMeta.estimatedWorkMinutes}m planned`
        : `${t.workTime}m x ${t.targetSessions}`;
    const finishAt = estimatedFinishTime(t);
    const deadlineContribution = dueText?.includes('overdue')
        ? 'This focus block helps reduce overdue pressure.'
        : dueText
            ? `This block contributes toward a deadline in ${dueText.replace(' left', '')}.`
            : null;

    return (
        <div className={styles.selectedTaskCard}>
            <div className={styles.selectedTaskTop}>
                <span className={styles.selectedTaskEyebrow}>Currently Working On</span>
                <span className={styles.selectedTaskModule}>{moduleCode}</span>
            </div>
            <p className={styles.selectedTaskTitle}>{title}</p>
            <div className={styles.selectedTaskMetaRow}>
                <span>{listName}</span>
                <span>{dueText || 'No deadline set'}</span>
                <span>{effort}</span>
                <span>{sessionsLeft} session{sessionsLeft === 1 ? '' : 's'} left</span>
                {finishAt && <span>Done by {finishAt}</span>}
            </div>
            <div className={styles.selectedTaskActions}>
                {deadlineContribution && <span className={styles.selectedTaskContribution}>{deadlineContribution}</span>}
                <a href="/tasks" className={styles.selectedTaskLink}>Open task</a>
            </div>
        </div>
    );
}

const AMBIENT_SOUNDS = [
    { id: 'pink', label: '🌧️ Maughan Library Rain', noiseKey: 'pink' },
    { id: 'brown', label: '☕ Strand Coffee Shop', noiseKey: 'brown' },
    { id: 'white', label: '🌬️ Waterloo Wind', noiseKey: 'white' },
];

const MUSIC_STATIONS = [
    {
        id: 'yt-lofi',
        label: 'Lo-fi Beats',
        provider: 'youtube',
        embedUrl: 'https://www.youtube.com/embed/_4kHxtiuML0?autoplay=1',
        externalUrl: 'https://www.youtube.com/watch?v=_4kHxtiuML0',
    },
    {
        id: 'yt-morning',
        label: 'Morning Focus',
        provider: 'youtube',
        embedUrl: 'https://www.youtube.com/embed/1fueZCTYkpA?autoplay=1',
        externalUrl: 'https://www.youtube.com/watch?v=1fueZCTYkpA',
    },
    {
        id: 'yt-deadline',
        label: 'Deadline Mode',
        provider: 'youtube',
        embedUrl: 'https://www.youtube.com/embed/VTjmPTCbdqc?autoplay=1',
        externalUrl: 'https://www.youtube.com/watch?v=VTjmPTCbdqc',
    },
    {
        id: 'yt-latenight',
        label: 'Late Night',
        provider: 'youtube',
        embedUrl: 'https://www.youtube.com/embed/f_FSWEg9Wgk?autoplay=1',
        externalUrl: 'https://www.youtube.com/watch?v=f_FSWEg9Wgk',
    },
    {
        id: 'spotify-lofi',
        label: 'Lo-fi Café',
        provider: 'spotify',
        embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0',
        externalUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS',
    },
    {
        id: 'spotify-studyflax',
        label: 'StudyFlax Mix',
        provider: 'spotify',
        embedUrl: 'https://open.spotify.com/embed/artist/1B95N9f9HtEL9D21OCaTkt?utm_source=generator&theme=0',
        externalUrl: 'https://open.spotify.com/artist/1B95N9f9HtEL9D21OCaTkt',
    },
];

const SpotifyIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
);

const YouTubeIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
);

function InlineSoundPanel() {
    const { noiseType, toggle, volume, setVolume } = useAmbientSound();
    const [activeStation, setActiveStation] = useState(null);

    const toggleStation = (station) => {
        setActiveStation((prev) => prev?.id === station.id ? null : station);
    };

    return (
        <div className={`${styles.timerSoundCard} ${styles.timerSoundCardInline}`}>
            <div className={styles.soundSplitGrid}>
                <section className={styles.soundPaneStreams}>
                    <div className={styles.musicStationsWrap}>
                        <span className={styles.musicStationsLabel}>Music & Streams</span>
                        <div className={styles.musicStationsGrid}>
                            {MUSIC_STATIONS.map((station) => {
                                const isActive = activeStation?.id === station.id;
                                const ProviderIcon = station.provider === 'spotify' ? SpotifyIcon : YouTubeIcon;
                                return (
                                    <button
                                        key={station.id}
                                        type="button"
                                        className={`${styles.musicStationBtn} ${isActive ? styles.musicStationBtnActive : ''} ${styles[`musicStation_${station.provider}`]}`}
                                        onClick={() => toggleStation(station)}
                                        title={isActive ? `Close ${station.label}` : `Play ${station.label}`}
                                    >
                                        <span className={styles.musicStationLabel}>{station.label}</span>
                                        <ProviderIcon />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {activeStation && (
                        <div className={styles.musicEmbedWrap}>
                            <div className={styles.musicEmbedHeader}>
                                <span className={styles.musicEmbedTitle}>
                                    {activeStation.provider === 'spotify' ? <SpotifyIcon /> : <YouTubeIcon />}
                                    {activeStation.label}
                                </span>
                                <div className={styles.musicEmbedActions}>
                                    <a
                                        href={activeStation.externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.musicEmbedExternal}
                                        title="Open in app"
                                    >
                                        ↗
                                    </a>
                                    <button
                                        type="button"
                                        className={styles.musicEmbedClose}
                                        onClick={() => setActiveStation(null)}
                                        title="Close player"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <iframe
                                className={styles.musicEmbedIframe}
                                src={activeStation.embedUrl}
                                width="100%"
                                height={activeStation.provider === 'spotify' ? 152 : 168}
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                title={activeStation.label}
                            />
                        </div>
                    )}
                </section>

                <section className={styles.soundPaneAmbient}>
                    <div className={styles.soundSelectorContainer}>
                        <span className={styles.soundPillsLabel}>Ambient Sounds</span>
                        <div className={styles.soundPillsRow}>
                            {AMBIENT_SOUNDS.map((sound) => (
                                <button
                                    key={sound.id}
                                    type="button"
                                    className={`${styles.soundPill} ${noiseType === sound.noiseKey ? styles.soundPillActive : ''}`}
                                    onClick={() => toggle(sound.noiseKey)}
                                    title={`Toggle ${sound.label}`}
                                >
                                    <span className={styles.soundPillLabel}>{sound.label}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                className={`${styles.soundPill} ${noiseType === 'none' ? styles.soundPillActive : ''}`}
                                onClick={() => toggle('none')}
                                title="Turn ambient sound off"
                            >
                                <span className={styles.soundPillEmoji}>🔇</span>
                                <span className={styles.soundPillLabel}>None</span>
                            </button>
                        </div>
                        <div className={styles.soundVolumeRow}>
                            <input
                                className={styles.volumeSlider}
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                aria-label="Ambient sound volume"
                            />
                            <span className={styles.soundVolumeIcon}>🔊</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export const MainSection = ({ t, onOpenHistory, onOpenFocus, isMobile }) => {
    const startManualTask = useCallback(() => {
        const title = (t.task || '').trim();
        if (!title) {
            t.setIsActive(true);
            return;
        }
        if (t.setActiveTaskId) {
            t.setActiveTaskId(null, {
                title,
                moduleCode: t.activeTaskMeta?.moduleCode || null,
                dueDate: t.activeTaskMeta?.dueDate || null,
                listName: t.activeTaskMeta?.listName || 'Quick task',
                taskType: inferTaskType(title),
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
                blockTotalWork={t.blockTotalWork}
                blockTotalBreak={t.blockTotalBreak}
                totalPaused={t.totalPaused}
                distractions={t.distractionCount}
                isActive={t.isActive}
                isPaused={t.isPaused}
                onDistract={t.addDistraction}
            />
            {isMobile && (
                <button className={styles.mobileHistoryBtn} onClick={onOpenHistory}>View History 📜</button>
            )}
        </div>
    );
};

export const RightPanel = ({ t }) => (
    <div className={styles.timerRightPanel}>
        <RightRailTabs t={t} />
        <InlineSoundPanel />
    </div>
);

function RightRailTabs({ t }) {
    const [tab, setTab] = useState('presets');
    const tabs = [
        { id: 'presets', label: 'Presets', content: <PresetPanel t={t} embedded /> },
        { id: 'config', label: 'Configuration', content: <TimerConfigPanel t={t} embedded /> },
        { id: 'history', label: 'History', content: <RightRailHistoryPanel /> },
    ];
    return (
        <div className={styles.presetPanelCard}>
            <Tabs
                tabs={tabs}
                activeTab={tab}
                onTabChange={setTab}
                layoutId="timerRightRailTab"
                tabVariant="heading"
            />
        </div>
    );
}

function startOfDay(dateLike) {
    const d = new Date(dateLike);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getHistoryHorizonLabel(dateValue, now = new Date()) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Earlier';
    const today = startOfDay(now);
    const target = startOfDay(date);
    const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const shift = (day + 6) % 7; // Monday as first day
    weekStart.setDate(weekStart.getDate() - shift);
    if (target >= weekStart) return 'This Week';
    return 'Earlier';
}

function getSevenDayFocusSeries(blocks, now = new Date()) {
    const days = [];
    const dayMap = new Map();
    for (let i = 6; i >= 0; i -= 1) {
        const d = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
        const key = d.toISOString().slice(0, 10);
        const shortLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
        const item = { key, label: shortLabel, seconds: 0 };
        days.push(item);
        dayMap.set(key, item);
    }
    blocks.forEach((block) => {
        const date = new Date(block.startTime || block.endTime || Date.now());
        if (Number.isNaN(date.getTime())) return;
        const key = startOfDay(date).toISOString().slice(0, 10);
        const bucket = dayMap.get(key);
        if (!bucket) return;
        bucket.seconds += Number(block.totalDuration || 0);
    });
    return days;
}

function extractModuleLabel(block) {
    if (block.module) return block.module;
    const session = Array.isArray(block.sessions) ? block.sessions.find((s) => s?.module || s?.module_code || s?.moduleCode || s?.list) : null;
    return session?.module || session?.module_code || session?.moduleCode || session?.list || null;
}

function ClearHistoryModal({ onConfirm, onCancel }) {
    return (
        <HoldConfirmModal
            title="Clear History"
            warningText="This will permanently delete all logged sessions. This action cannot be undone."
            cancelLabel="Keep History"
            holdLabel="Hold to Clear"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
}

function RightRailHistoryPanel() {
    const [history, setHistory] = useState([]);
    const [earlierExpanded, setEarlierExpanded] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);

    useEffect(() => {
        const refresh = async () => {
            try {
                const data = await getHistory();
                setHistory(Array.isArray(data) ? data : []);
            } catch {
                setHistory([]);
            }
        };

        refresh();
        window.addEventListener('timerHistoryUpdated', refresh);
        window.addEventListener('historyCleared', refresh);
        return () => {
            window.removeEventListener('timerHistoryUpdated', refresh);
            window.removeEventListener('historyCleared', refresh);
        };
    }, []);

    const blocks = useMemo(() => groupHistoryByBlock(history), [history]);
    const visibleBlocks = useMemo(() => (
        blocks.filter((block) => {
            const seconds = Number(block.totalDuration || 0);
            const completedCount = Array.isArray(block.sessions)
                ? block.sessions.filter((s) => s?.status !== 'Incomplete').length
                : 0;
            return seconds >= 300 || completedCount > 0;
        })
    ), [blocks]);
    const groupedByHorizon = useMemo(() => {
        const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
        const map = new Map(order.map((k) => [k, []]));
        visibleBlocks.slice(0, 24).forEach((block) => {
            const label = getHistoryHorizonLabel(block.startTime);
            map.get(label).push(block);
        });
        return order
            .map((label) => ({ label, entries: map.get(label) || [] }))
            .filter((group) => group.entries.length > 0);
    }, [visibleBlocks]);
    const weeklySeries = useMemo(() => getSevenDayFocusSeries(blocks), [blocks]);
    const maxWeeklySeconds = useMemo(
        () => Math.max(60, ...weeklySeries.map((d) => Number(d.seconds || 0))),
        [weeklySeries]
    );

    const handleClearHistory = useCallback(() => {
        setShowClearModal(true);
    }, []);

    const handleConfirmClear = useCallback(async () => {
        setShowClearModal(false);
        await clearHistory();
        setHistory([]);
        window.dispatchEvent(new Event('historyCleared'));
    }, []);

    return (
        <div className={styles.rightHistoryPanel}>
            {visibleBlocks.length === 0 ? (
                <div className={historyStyles.empty}>No recent sessions.</div>
            ) : (
                <>
                    <section className={styles.rightHistoryWeeklySummary}>
                        <div className={styles.rightHistoryWeeklyHeader}>Weekly Summary</div>
                        <div className={styles.rightHistoryWeeklyChart} role="img" aria-label="Focus hours per day for the last 7 days">
                            {weeklySeries.map((day) => {
                                const ratio = Math.max(0.04, Number(day.seconds || 0) / maxWeeklySeconds);
                                const hours = (Number(day.seconds || 0) / 3600).toFixed(1);
                                return (
                                    <div key={day.key} className={styles.rightHistoryWeeklyBarCol}>
                                        <div className={styles.rightHistoryWeeklyBarTrack}>
                                            <span className={styles.rightHistoryWeeklyBarFill} style={{ height: `${Math.round(ratio * 100)}%` }} />
                                        </div>
                                        <span className={styles.rightHistoryWeeklyBarLabel}>{day.label}</span>
                                        <span className={styles.rightHistoryWeeklyValue}>{hours}h</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                    <div className={styles.rightHistorySections}>
                        {groupedByHorizon.map((group) => {
                            const isEarlier = group.label === 'Earlier';
                            const visibleEntries = isEarlier && !earlierExpanded
                                ? group.entries.slice(0, 1)
                                : group.entries;
                            const hiddenEarlierCount = isEarlier ? Math.max(0, group.entries.length - visibleEntries.length) : 0;
                            return (
                            <section key={group.label} className={styles.rightHistorySection}>
                                <div className={styles.rightHistorySectionTitle}>{group.label}</div>
                                <ul className={styles.rightHistoryCardList}>
                                    {visibleEntries.map((block, idx) => {
                                        const completedCount = Array.isArray(block.sessions)
                                            ? block.sessions.filter((s) => s?.status !== 'Incomplete').length
                                            : 0;
                                        const totalSessions = Array.isArray(block.sessions) ? block.sessions.length : 0;
                                        const statusText = completedCount > 0 ? 'Completed' : 'Partial';
                                        const partial = completedCount === 0;
                                        const durationText = formatDuration(block.totalDuration) || '0m';
                                        const moduleLabel = extractModuleLabel(block);
                                        const timeLabel = formatTimeRange(block.startTime, block.endTime) || '—';
                                        const taskLabel = block.task || 'Focus Session';
                                        return (
                                            <li key={`${group.label}-${block.id ?? idx}`} className={styles.rightHistorySessionCard}>
                                                <div className={styles.rightHistorySessionTop}>
                                                    <span className={styles.rightHistorySessionTask}>{taskLabel}</span>
                                                    <span className={styles.rightHistorySessionDuration}>{durationText}</span>
                                                </div>
                                                <div className={styles.rightHistorySessionMeta}>
                                                    <span>{moduleLabel || 'General'}</span>
                                                    <span>{timeLabel}</span>
                                                </div>
                                                <div className={styles.rightHistorySessionTags}>
                                                    <span className={`${styles.rightHistoryStatusPill} ${partial ? styles.rightHistoryStatusPartial : ''}`}>
                                                        {statusText}
                                                    </span>
                                                    <span className={styles.rightHistoryStatPill}>
                                                        {completedCount}/{Math.max(totalSessions, 1)} sessions
                                                    </span>
                                                    {Number(block.totalBreak || 0) > 0 ? (
                                                        <span className={styles.rightHistoryStatPill}>☕ {formatDuration(block.totalBreak)} break</span>
                                                    ) : null}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {isEarlier && group.entries.length > 1 ? (
                                    <div className={styles.rightHistoryShowMoreWrap}>
                                        <PrimaryButton
                                            type="button"
                                            pill
                                            size="small"
                                            onClick={() => setEarlierExpanded((prev) => !prev)}
                                        >
                                            {earlierExpanded ? 'Show less ↑' : `Show all ${hiddenEarlierCount + 1} →`}
                                        </PrimaryButton>
                                    </div>
                                ) : null}
                            </section>
                            );
                        })}
                    </div>
                    <div className={styles.rightHistoryActions}>
                        <PrimaryButton type="button" variant="ghost" pill size="small" onClick={handleClearHistory}>
                            Clear History
                        </PrimaryButton>
                    </div>
                </>
            )}
            {showClearModal && (
                <ClearHistoryModal
                    onConfirm={handleConfirmClear}
                    onCancel={() => setShowClearModal(false)}
                />
            )}
        </div>
    );
}

export const PopupSection = ({ t, showHistory, onCloseHistory }) => {
    // Auto-start break when toggle is on
    useEffect(() => {
        if (t.modal !== 'break') return;
        if (localStorage.getItem(AUTOSTART_KEY) !== 'true') return;
        const id = setTimeout(() => t.handlers.break(), 2000);
        return () => clearTimeout(id);
    }, [t.modal, t.handlers]);

    useEffect(() => {
        if (t.modal !== 'autoBreak') return;
        if (!t.isActive || t.timeLeft > 0) return;
        const id = setTimeout(() => t.handlers.autoBreakDone(), 250);
        return () => clearTimeout(id);
    }, [t.modal, t.isActive, t.timeLeft, t.handlers]);

    const h = showHistory ? <HistoryModal onClose={onCloseHistory} /> : null;
    const oWork = t.isOvertime ? <OvertimePopup mode="work" time={t.timeLeft} onAction={t.handlers.break} isLastSession={(t.completedSessions + 1) >= t.targetSessions} /> : null;
    const oBreak = t.isBreakOvertime ? <OvertimePopup mode="break" time={t.timeLeft} onAction={t.handlers.overtimeBreak} /> : null;
    const aBreak = t.modal === 'autoBreak' ? <BreakStartedPopup time={t.timeLeft} onAction={t.handlers.autoBreakDone} /> : null;
    // When auto-start is on, skip the BreakModal (handled by useEffect above)
    const autoStart = typeof localStorage !== 'undefined' && localStorage.getItem(AUTOSTART_KEY) === 'true';
    const bModal = t.modal === 'break' && !autoStart ? <BreakModal onAction={t.handlers.break} isLastSession={(t.completedSessions + 1) >= t.targetSessions} /> : null;
    const gModal = t.modal === 'goal' ? <GoalModal sessions={t.completedSessions} workTime={t.blockTotalWork} breakTime={t.blockTotalBreak} onAction={t.handlers.goal} distractionCount={t.distractionCount} /> : null;
    const currentGoalSeconds = Math.max(60, Number((t.mode === 'break' ? t.breakTime : t.workTime) || 25) * 60);
    const currentElapsedSeconds = Math.max(0, currentGoalSeconds - Math.max(0, Number(t.timeLeft || 0)));
    const eModal = t.modal === 'endEarly'
        ? <EndEarlyModal onConfirm={t.handlers.endEarly} onCancel={() => t.setModal(null)} elapsedSeconds={currentElapsedSeconds} goalSeconds={currentGoalSeconds} />
        : null;
    return <>{h}{aBreak}{oWork}{oBreak}{bModal}{gModal}{eModal}</>;
};

/** Minimal content for full-screen focus overlay */
export const FocusOverlayContent = ({ t, streakData = null, onExitFocus }) => {
    const finishAt = estimatedFinishTime(t);
    const goalDone = Math.max(0, Number(t.completedSessions || 0));
    const goalTotal = Math.max(1, Number(t.targetSessions || 1));
    const goalPct = Math.max(0, Math.min(100, Math.round((goalDone / goalTotal) * 100)));
    const todayFocusClock = formatHoursAsClock(streakData?.total_study_hours ?? 0);
    const streakDays = Math.max(0, Number(streakData?.current_streak_days ?? 0));

    return (
        <div className={styles.focusOverlayFrame}>
            <div className={styles.focusOverlayRail}>
                <div className={styles.focusOverlayRailExit}>
                    <BackButton
                        className={styles.focusOverlayRailBackBtn}
                        onClick={onExitFocus}
                        label="Exit Focus"
                    />
                </div>
                <span className={styles.focusOverlayRailDivider} aria-hidden="true" />
                <div className={styles.focusOverlayRailStat}>
                    <span className={styles.focusOverlayRailLabel}>Goal</span>
                    <span className={styles.focusOverlayRailValue}>{goalDone}/{goalTotal} Sessions</span>
                    <div className={styles.focusOverlayRailProgress}>
                        <span className={styles.focusOverlayRailProgressFill} style={{ width: `${goalPct}%` }} />
                    </div>
                </div>
                <span className={styles.focusOverlayRailDivider} aria-hidden="true" />
                <div className={styles.focusOverlayRailStat}>
                    <span className={styles.focusOverlayRailLabel}>Focus Time</span>
                    <span className={styles.focusOverlayRailValue}>{todayFocusClock} Today</span>
                </div>
                <span className={styles.focusOverlayRailDivider} aria-hidden="true" />
                <div className={`${styles.focusOverlayRailStat} ${styles.focusOverlayRailStatRight}`}>
                    <span className={styles.focusOverlayRailLabel}>Streak</span>
                    <span className={styles.focusOverlayRailValue}>🔥 {streakDays} Days</span>
                </div>
            </div>
            <div className={styles.focusOverlayMainCard}>
                <div className={styles.focusOverlayLeft}>
                    {t.task && <p className={styles.focusOverlayTask}>{t.task}</p>}
                    <SessionDots
                        completedSessions={t.completedSessions}
                        targetSessions={t.targetSessions}
                        isActive={t.isActive}
                        isPaused={t.isPaused}
                    />
                    {finishAt && <div className={styles.estimatedFinish}>~Done by {finishAt}</div>}
                    <TimerCircle t={t} />
                    <LiveStatsRow
                        blockTotalWork={t.blockTotalWork}
                        blockTotalBreak={t.blockTotalBreak}
                        totalPaused={t.totalPaused}
                        distractions={t.distractionCount}
                        isActive={t.isActive}
                        isPaused={t.isPaused}
                        onDistract={t.addDistraction}
                    />
                </div>
                <div className={styles.focusOverlayRight}>
                    <InlineSoundPanel />
                </div>
            </div>
        </div>
    );
};

const formatSessionMinutes = (seconds) => `${Math.max(0, Math.round(seconds / 60))}m`;

const extractTime = (value) => {
    try {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
};

const isToday = (dateValue) => {
    const d = extractTime(dateValue);
    if (!d) return false;
    const now = new Date();
    return d.toDateString() === now.toDateString();
};

export const SessionLogTable = () => {
    const [rows, setRows] = useState([]);

    const refreshHistory = async () => {
        try {
            const data = await getHistory();
            const today = Array.isArray(data) ? data.filter((r) => isToday(r.start_time || r.startTime || r.date || r.end_time || r.endTime)) : [];
            setRows(today.sort((a, b) => {
                const aTime = extractTime(a.start_time || a.startTime || a.date || a.end_time || a.endTime);
                const bTime = extractTime(b.start_time || b.startTime || b.date || b.end_time || b.endTime);
                if (!aTime || !bTime) return 0;
                return bTime - aTime;
            }));
        } catch {
            setRows([]);
        }
    };

    useEffect(() => {
        refreshHistory();
        const handler = () => refreshHistory();
        window.addEventListener('timerHistoryUpdated', handler);
        window.addEventListener('historyCleared', handler);
        return () => {
            window.removeEventListener('timerHistoryUpdated', handler);
            window.removeEventListener('historyCleared', handler);
        };
    }, []);

    const hasRows = rows.length > 0;
    return (
        <div className={styles.sessionLogCard}>
            <div className={styles.sessionLogHeader}>Today’s Sessions</div>
            {hasRows ? (
                <table className={styles.sessionLogTable}>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Duration</th>
                            <th>Module / Task</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, idx) => {
                            const start = extractTime(r.start_time || r.startTime || r.date || r.end_time || r.endTime);
                            const task = r.task || 'Break';
                            const moduleName = r.module || r.module_code || r.moduleCode;
                            const taskLabel = moduleName ? `${task} · ${moduleName}` : task;
                            const status = r.status || 'Completed';
                            return (
                                <tr key={r.id ?? `${task}-${idx}`}>
                                    <td>{start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                    <td>{formatSessionMinutes(r.duration ?? 0)}</td>
                                    <td>{taskLabel}</td>
                                    <td>{status}</td>
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
