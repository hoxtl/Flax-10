import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { noiseGenerator } from './utils/noiseUtils';
import { FOCUS_BLOCK_COLOURS_HEX } from '../../pages/Tasks/constants/focusBlockColours';
import AnimatedDropdown from '../ui/AnimatedDropdown';
import MultiSelectDropdown from '../ui/MultiSelectDropdown';

import styles from "../../pages/Timer/TimerPage.module.css";

/** Formats seconds to MM:SS */
export const formatTime = (seconds) => {
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60).toString().padStart(2, '0');
    const s = (abs % 60).toString().padStart(2, '0');
    return `${seconds < 0 ? '+' : ''}${m}:${s}`;
};

export const TimerDisplay = ({ timeLeft, mode, isOvertime }) => {
    const className = `${styles.timerDisplay} ${mode === 'break' ? styles.break : ''} ${isOvertime ? styles.overtime : ''}`;
    return <div className={className}>{formatTime(timeLeft)}</div>;
};

const getModeText = (mode, isOvertime, isBreakOvertime, isActive, timeLeft, workTime) => {
    if (mode === 'work') {
        if (!isActive) {
            const fullWorkSeconds = ((workTime ?? 25) * 60);
            const left = timeLeft ?? fullWorkSeconds;
            const neverStarted = left >= fullWorkSeconds - 1;
            if (neverStarted) return '🔥 Focus Time';
            return 'Focus Paused — take a breather';
        }
        return isOvertime ? '🚀 Overtime' : '🔥 Focus Time';
    }
    return isBreakOvertime ? '⏳ Break Overtime' : '☕ Break Time';
};

export const ModeIndicator = ({ mode, isOvertime, isBreakOvertime, isActive, timeLeft, workTime }) => {
    const fullWork = ((workTime ?? 25) * 60);
    const showPausedStyle = mode === 'work' && !isActive && (timeLeft != null && timeLeft < fullWork - 1);
    return (
        <div className={`${styles.modeIndicator} ${mode === 'break' ? styles.break : ''} ${showPausedStyle ? styles.paused : ''}`}>
            {getModeText(mode, isOvertime, isBreakOvertime, isActive, timeLeft, workTime)}
        </div>
    );
};

export const SessionStatus = ({ current, total }) => (
    <div className={styles.sessionStatus}>Session {current + 1} of {total}</div>
);

/** Action buttons: Start / Resume / Pause / Reset — Show "Start" when session loaded but not yet started (full time left). */
export const TimerControls = ({ isActive, onToggle, onReset, timeLeft, task, workTime }) => {
    const hasSession = !!(task || timeLeft > 0);
    const fullWorkSeconds = (workTime || 25) * 60;
    const neverStarted = hasSession && !isActive && timeLeft >= fullWorkSeconds - 1;
    const buttonLabel = isActive ? 'Pause' : (neverStarted ? 'Start' : hasSession ? 'Resume' : 'Start');
    return (
        <div className={styles.controls}>
            <button
                type="button"
                className={`${styles.timerResumeBtn} ${isActive ? styles.timerResumeBtnActive : ''}`}
                onClick={onToggle}
                aria-label={buttonLabel}
                title={buttonLabel}
            >
                {buttonLabel}
            </button>
            {hasSession && (
                <button className={`${styles.button} ${styles.danger}`} onClick={onReset} title="Reset session">Reset</button>
            )}
        </div>
    );
};

// Helpers for useBufferedInput
const handleInput = (e, min, setLocal, onError) => {
    const num = parseInt(e.target.value);
    const isMin = !isNaN(num) && num < min;
    setLocal(isMin ? min : e.target.value);
    if (onError) onError(isMin);
};

const commitInput = (local, value, min, setLocal, onUpdate, onError) => {
    const final = Math.max(parseInt(local) || min, min);
    setLocal(final);
    if (final !== value) onUpdate(final);
    if (onError) onError(false);
};

const handleArrowDown = (e, local, min, onError) => {
    if (local !== '' && parseInt(local) > min) return;
    e.preventDefault();
    if (onError) onError(true);
};

const handleKey = (e, local, min, onError) => {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'ArrowDown') handleArrowDown(e, local, min, onError);
};

const useBufferedInput = (value, onUpdate, min, onError) => {
    const [local, setLocal] = useState(value);
    useEffect(() => setLocal(value), [value]);

    const onChange = (e) => handleInput(e, min, setLocal, onError);
    const onBlur = () => commitInput(local, value, min, setLocal, onUpdate, onError);
    const onKeyDown = (e) => handleKey(e, local, min, onError);

    return { local, onChange, onBlur, onKeyDown };
};

const BufferedInput = ({ label, value, ...props }) => {
    const { local, onChange, onBlur, onKeyDown } = useBufferedInput(value, props.onUpdate, props.min, props.onError);
    return (
        <div className={styles.settingItem}>
            <label className={styles.label}>{label}</label>
            <input type="number" className={styles.input} value={local} onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} onFocus={(e) => e.target.select()} />
        </div>
    );
};

const Disclaimer = ({ show }) => {
    if (!show) return null;
    return (
        <div className={styles.disclaimer} style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7, color: '#ef4444' }}>
            * Minimum study time is 1 minute
        </div>
    );
};

// Refactored TimerSettings
const SettingsInputs = ({ work, breakTime, sessions, onUpdate, setShowError }) => (
    <div className={styles.settings}>
        <BufferedInput label="Work (min)" value={work} min={1} onUpdate={(v) => onUpdate('work', v)} onError={setShowError} />
        <BufferedInput label="Break (min)" value={breakTime} min={0} onUpdate={(v) => onUpdate('break', v)} />
        <BufferedInput label="Sessions" value={sessions} min={1} onUpdate={(v) => onUpdate('sessions', v)} />
    </div>
);

export const TimerSettings = ({ work, breakTime, sessions, onUpdate }) => {
    const [showError, setShowError] = useState(false);
    return (
        <div className={styles.settingsContainer}>
            <SettingsInputs work={work} breakTime={breakTime} sessions={sessions} onUpdate={onUpdate} setShowError={setShowError} />
            <Disclaimer show={showError} />
        </div>
    );
};

// Refactored SoundSelector
const SoundOptions = () => (
    <>
        <option value="none">None 🔇</option>
        <option value="white">White Noise 🌊</option>
        <option value="pink">Pink Noise 🌧️</option>
        <option value="brown">Brown Noise 🏔️</option>
    </>
);

const SoundControls = ({ noiseType, setNoiseType }) => (
    <div className={styles.soundControls}>
        <span className={styles.label}>Calming Sound:</span>
        <select className={styles.soundSelect} value={noiseType} onChange={(e) => setNoiseType(e.target.value)}>
            <SoundOptions />
        </select>
    </div>
);

const applyNoise = (noiseType) => {
    if (noiseType === 'none') return noiseGenerator.stop();
    noiseGenerator.play(noiseType);
    noiseGenerator.setVolume(0.5);
};

const useNoiseEffect = (noiseType) => {
    useEffect(() => {
        applyNoise(noiseType);
        return () => noiseGenerator.stop();
    }, [noiseType]);
};

export const SoundSelector = () => {
    const [noiseType, setNoiseType] = useState('none');
    useNoiseEffect(noiseType);

    return (
        <div className={styles.soundSelectorContainer}>
            <SoundControls noiseType={noiseType} setNoiseType={setNoiseType} />
        </div>
    );
};

const handleTaskKey = (e) => {
    if (e.key === 'Enter') e.target.blur();
};

/** Task input with optional pick-from-tasks list (sort by urgency/due/time, filter by list/module) */
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
const SORT_URGENCY = 'urgency';
const SORT_TIME = 'time';
const SORT_DUE = 'due';
const SORT_ALPHA = 'alpha';
const SORT_DATE_ADDED = 'date_added';

const SORT_OPTIONS = [
    { value: SORT_URGENCY,   label: 'Urgency' },
    { value: SORT_DUE,       label: 'Due date' },
    { value: SORT_ALPHA,     label: 'A → Z' },
    { value: SORT_DATE_ADDED, label: 'Date added' },
    { value: SORT_TIME,      label: 'Estimated time' },
];

export const TaskInput = ({ value, onChange, onTaskSelect }) => {
    const [open, setOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState(SORT_URGENCY);
    const [search, setSearch] = useState('');
    const [filterListIds, setFilterListIds] = useState([]);
    const [filterModuleCodes, setFilterModuleCodes] = useState([]);
    const ref = useRef(null);

    const loadTasks = useCallback((sort = sortBy) => {
        setLoading(true);
        Promise.all([
            import('../../api/taskService').then(({ fetchTasks }) => fetchTasks()),
            import('../../api/taskService').then(({ fetchTaskLists }) => fetchTaskLists()),
        ])
            .then(([tasksData, listsData]) => {
                const listMap = {};
                const listArr = listsData || [];
                listArr.forEach((list, idx) => {
                    listMap[String(list.id)] = {
                        name: list.name || 'Other',
                        color: list.color || FOCUS_BLOCK_COLOURS_HEX[idx % FOCUS_BLOCK_COLOURS_HEX.length],
                    };
                });
                setLists(listArr);
                let list = (tasksData || []).filter((t) => !t.completed).map((t) => {
                    const listInfo = listMap[String(t.task_list)] || { name: 'Other', color: '#94a3b8' };
                    return { ...t, list_name: listInfo.name, list_color: listInfo.color };
                });
                if (sort === SORT_TIME) {
                    list.sort((a, b) => ((a.estimated_blocks || 1) - (b.estimated_blocks || 1)) || ((PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)));
                } else if (sort === SORT_DUE) {
                    list.sort((a, b) => {
                        if (!a.due_date && !b.due_date) return 0;
                        if (!a.due_date) return 1;
                        if (!b.due_date) return -1;
                        return new Date(a.due_date) - new Date(b.due_date);
                    });
                } else if (sort === SORT_ALPHA) {
                    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                } else if (sort === SORT_DATE_ADDED) {
                    list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
                } else {
                    list.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4));
                }
                setTasks(list.slice(0, 100));
            })
            .catch(() => setTasks([]))
            .finally(() => setLoading(false));
    }, [sortBy]);

    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    const handleOpen = () => {
        if (!open) loadTasks();
        setOpen((o) => !o);
    };

    const selectTask = (task) => {
        onChange(task.title);
        setOpen(false);
        onTaskSelect?.(task);
    };

    const searchLower = (search || '').toLowerCase().trim();
    const listOptions = useMemo(() => [
        { value: '', label: 'All lists' },
        ...(lists || []).map((l) => ({ value: String(l.id), label: l.name || 'Other' })),
    ], [lists]);
    const moduleOptions = useMemo(() => {
        const codes = [...new Set((tasks || []).map((t) => t.module_code).filter(Boolean))].sort();
        return [{ value: '', label: 'All modules' }, ...codes.map((c) => ({ value: c, label: c }))];
    }, [tasks]);

    let filteredTasks = searchLower
        ? tasks.filter((t) => (t.title || '').toLowerCase().includes(searchLower) || (t.list_name || '').toLowerCase().includes(searchLower) || ((t.module_code || '').toLowerCase().includes(searchLower)))
        : tasks;
    if (filterListIds && filterListIds.length > 0) {
        const set = new Set(filterListIds.map(String));
        filteredTasks = filteredTasks.filter((t) => set.has(String(t.task_list)));
    }
    if (filterModuleCodes && filterModuleCodes.length > 0) {
        const set = new Set(filterModuleCodes.map(String));
        filteredTasks = filteredTasks.filter((t) => set.has(String(t.module_code || '')));
    }

    return (
        <div className={styles.taskInputWrap}>
            {value && (
                <div className={styles.currentTaskLabel}>Currently focusing on:</div>
            )}
            <div className={styles.taskInputContainer} ref={ref}>
                <input
                    type="text"
                    className={`${styles.taskInput} ${value ? styles.taskInputHasValue : ''}`}
                    placeholder="What are you working on? 🎯"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleTaskKey}
                />
                <div className={styles.taskInputActions}>
                    <span className={styles.taskInputHint}>Choose a task to start</span>
                    <button
                        type="button"
                        className={styles.taskPickBtn}
                        onClick={handleOpen}
                        title="Select a task"
                    >
                        Select Task
                    </button>
                </div>
                {open && (
                    <>
                    <div className={styles.taskPickBackdrop} onClick={() => setOpen(false)} />
                    <div className={styles.taskPickDropdown} role="dialog" aria-label="Select task">
                        <div className={styles.taskPickSearchRow}>
                            <span className={styles.taskPickSearchIcon} aria-hidden>🔍</span>
                            <input
                                type="text"
                                className={styles.taskPickSearchInput}
                                placeholder="Search tasks…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className={styles.taskPickSortRow}>
                            <label className={styles.taskPickSortLabel}>SORT</label>
                            <AnimatedDropdown
                                value={sortBy}
                                onChange={(v) => { setSortBy(v); loadTasks(v); }}
                                options={SORT_OPTIONS}
                                className={styles.taskPickSortDropdown}
                            />
                        </div>
                        <div className={styles.taskPickSortRow}>
                            <label className={styles.taskPickSortLabel}>FILTER BY LIST</label>
                            <MultiSelectDropdown
                                value={filterListIds}
                                onChange={setFilterListIds}
                                options={listOptions}
                                placeholder="All lists"
                                countLabel="lists"
                                className={styles.taskPickSortDropdown}
                            />
                        </div>
                        <div className={styles.taskPickSortRow}>
                            <label className={styles.taskPickSortLabel}>FILTER BY MODULE</label>
                            <MultiSelectDropdown
                                value={filterModuleCodes}
                                onChange={setFilterModuleCodes}
                                options={moduleOptions}
                                placeholder="All modules"
                                countLabel="modules"
                                className={styles.taskPickSortDropdown}
                            />
                        </div>
                        {loading ? (
                            <div className={styles.taskPickEmpty}>Loading…</div>
                        ) : filteredTasks.length === 0 ? (
                            <div className={styles.taskPickEmpty}>{searchLower ? 'No tasks match.' : 'No tasks. Add some on the Tasks page.'}</div>
                        ) : (
                            <div className={styles.taskPickList}>
                                {filteredTasks.map((task) => {
                                    const duration = task.estimated_blocks ? `${task.estimated_blocks * 25}m` : '25m';
                                    const listName = task.list_name || 'Other';
                                    const listColor = task.list_color || '#94a3b8';
                                    return (
                                        <button
                                            key={task.id}
                                            type="button"
                                            className={`${styles.taskPickItem} ${value === task.title ? styles.taskPickItemSelected : ''}`}
                                            onClick={() => selectTask(task)}
                                        >
                                            <span className={styles.taskPickTitle}>{task.title}</span>
                                            <span
                                                className={styles.taskPickListPill}
                                                style={{ background: `${listColor}22`, color: listColor }}
                                            >
                                                {listName}
                                            </span>
                                            <span className={styles.taskPickDuration}>{duration}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};