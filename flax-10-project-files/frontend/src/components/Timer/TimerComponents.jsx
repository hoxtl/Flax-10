import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check } from 'lucide-react';
import styles from "../../pages/Timer/TimerPage.module.css";
import SkeletonBlock from "../common/LoadingState/SkeletonBlock";
import { noiseGenerator } from './utils/noiseUtils';
import { FOCUS_BLOCK_COLOURS_HEX } from '../../pages/Tasks/constants/focusBlockColours';
import AnimatedDropdown from '../common/AnimatedDropdown';
import {
    compareTaskPriority,
    compareTaskDue,
    compareTaskEstimatedTime,
    getTaskDurationMinutes,
} from '../../lib/focusPlanner';

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

const getModeText = (mode, isOvertime, isBreakOvertime) => {
    if (mode === 'work') return isOvertime ? '🚀 Overtime' : '🔥 Focus Time';
    return isBreakOvertime ? '⏳ Break Overtime' : '☕ Break Time';
};

export const ModeIndicator = ({ mode, isOvertime, isBreakOvertime }) => (
    <div className={`${styles.modeIndicator} ${mode === 'break' ? styles.break : ''}`}>
        {getModeText(mode, isOvertime, isBreakOvertime)}
    </div>
);

export const SessionStatus = ({ current, total }) => (
    <div className={styles.sessionStatus}>Session {current + 1} of {total}</div>
);

const PauseIndicator = ({ isPaused, totalPaused }) => {
    if (!isPaused || totalPaused <= 0) return null;
    return <div className={styles.pauseIndicator}>Paused: {formatTime(totalPaused)}</div>;
};

const PrimaryTimerBtn = ({ isActive, isPaused, onToggle, onPause }) => {
    const label = !isActive ? 'Start' : (isPaused ? 'Resume' : 'Pause');
    const action = !isActive ? onToggle : onPause;
    return <button className={`${styles.button} ${styles.primary}`} onClick={action}>{label}</button>;
};

export const TimerControls = ({ isActive, isPaused, onToggle, onPause, onReset, onEndEarly, totalPaused }) => {
    const pInd = <PauseIndicator isPaused={isPaused} totalPaused={totalPaused} />;
    const pBtn = <PrimaryTimerBtn isActive={isActive} isPaused={isPaused} onToggle={onToggle} onPause={onPause} />;
    const rBtn = <button className={`${styles.button} ${styles.danger}`} onClick={onReset}>Reset</button>;
    const eBtn = <button className={`${styles.button} ${styles.danger} ${styles.outline}`} onClick={onEndEarly}>End Early</button>;
    const actns = isActive || isPaused ? <>{pBtn}{rBtn}{eBtn}</> : <>{pBtn}</>;
    return <div className={styles.controls}>{pInd}<div className={styles.buttonGroup}>{actns}</div></div>;
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
    const lbl = <label className={styles.label}>{label}</label>;
    const inp = <input type="number" className={styles.input} value={local} onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} onFocus={(e) => e.target.select()} />;
    return <div className={styles.settingItem}>{lbl}{inp}</div>;
};

const Disclaimer = ({ show }) => {
    if (!show) return null;
    const style = { marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7, color: '#ef4444' };
    return <div className={styles.disclaimer} style={style}>* Minimum study time is 1 minute</div>;
};

const SettingsInputs = ({ work, breakTime, sessions, onUpdate, setShowError }) => {
    const wInp = <BufferedInput label="Work (min)" value={work} min={1} onUpdate={(v) => onUpdate('work', v)} onError={setShowError} />;
    const bInp = <BufferedInput label="Break (min)" value={breakTime} min={0} onUpdate={(v) => onUpdate('break', v)} />;
    const sInp = <BufferedInput label="Sessions" value={sessions} min={1} onUpdate={(v) => onUpdate('sessions', v)} />;
    return <div className={styles.settings}>{wInp}{bInp}{sInp}</div>;
};

export const TimerSettings = ({ work, breakTime, sessions, onUpdate }) => {
    const [showError, setShowError] = useState(false);
    const inputs = <SettingsInputs work={work} breakTime={breakTime} sessions={sessions} onUpdate={onUpdate} setShowError={setShowError} />;
    const disc = <Disclaimer show={showError} />;
    return <div className={styles.settingsContainer}>{inputs}{disc}</div>;
};

const SOUND_OPTIONS = [
    { value: 'none', label: 'None 🔇' },
    { value: 'white', label: 'White Noise 🌊' },
    { value: 'pink', label: 'Pink Noise 🌧️' },
    { value: 'brown', label: 'Brown Noise 🏔️' },
];

const SoundControls = ({ noiseType, setNoiseType, volume, setVolume }) => {
    const lbl = <span className={styles.label}>Calming Sound:</span>;
    const dropdown = (
        <AnimatedDropdown
            value={noiseType}
            onChange={setNoiseType}
            placeholder="Select sound"
            options={SOUND_OPTIONS}
            grouped={false}
            className={styles.soundDropdown}
        />
    );
    const slider = noiseType !== 'none' ? (
        <input
            type="range"
            className={styles.volumeSlider}
            min={0} max={1} step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Volume"
            title={`Volume: ${Math.round(volume * 100)}%`}
        />
    ) : null;
    return <div className={styles.soundControls}>{lbl}{dropdown}{slider}</div>;
};

const applyNoise = (noiseType, volume) => {
    if (noiseType === 'none') return noiseGenerator.stop();
    noiseGenerator.play(noiseType);
    noiseGenerator.setVolume(volume);
};

const useNoiseEffect = (noiseType, volume) => {
    useEffect(() => {
        applyNoise(noiseType, volume);
        return () => noiseGenerator.stop();
    }, [noiseType, volume]);
};

export const SoundSelector = () => {
    const [noiseType, setNoiseType] = useState('none');
    const [volume, setVolume] = useState(0.5);
    useNoiseEffect(noiseType, volume);
    const ctrl = <SoundControls noiseType={noiseType} setNoiseType={setNoiseType} volume={volume} setVolume={setVolume} />;
    return <div className={styles.soundSelectorContainer}>{ctrl}</div>;
};

const handleTaskKey = (e) => {
    if (e.key === 'Enter') e.target.blur();
};

/** Task input with optional pick-from-tasks list (sort by urgency/due/time, filter by list/module) */
const SORT_URGENCY = 'urgency';
const SORT_TIME = 'time';
const SORT_DUE = 'due';
const SORT_ALPHA = 'alpha';
const SORT_DATE_ADDED = 'date_added';

const SORT_OPTIONS = [
    { value: SORT_URGENCY, label: 'Urgency' },
    { value: SORT_DUE, label: 'Due date' },
    { value: SORT_ALPHA, label: 'A → Z' },
    { value: SORT_DATE_ADDED, label: 'Date added' },
    { value: SORT_TIME, label: 'Estimated time' },
];

export const TaskInput = ({ value, onChange, onTaskSelect }) => {
    const [open, setOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState(SORT_URGENCY);
    const [search, setSearch] = useState('');
    const [filterListId, setFilterListId] = useState('');
    const [filterModuleCode, setFilterModuleCode] = useState('');
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
                    list.sort(compareTaskEstimatedTime);
                } else if (sort === SORT_DUE) {
                    list.sort(compareTaskDue);
                } else if (sort === SORT_ALPHA) {
                    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                } else if (sort === SORT_DATE_ADDED) {
                    list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
                } else {
                    list.sort(compareTaskPriority);
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
    if (filterListId) {
        filteredTasks = filteredTasks.filter((t) => String(t.task_list) === String(filterListId));
    }
    if (filterModuleCode) {
        filteredTasks = filteredTasks.filter((t) => String(t.module_code || '') === String(filterModuleCode));
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
                <AnimatePresence>
                    {open && (
                        <>
                            <motion.div
                                className={styles.taskPickBackdrop}
                                onClick={() => setOpen(false)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                            />
                            <motion.div
                                className={styles.taskPickDropdown}
                                role="dialog"
                                aria-label="Select task"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.18 }}
                                transformTemplate={({ scale }) => `translate(-50%, -50%) scale(${scale})`}
                            >
                                <div className={styles.taskPickHeader}>
                                    <div className={styles.taskPickHeaderCopy}>
                                        <span className={styles.taskPickHeaderTitle}>Select a Task</span>
                                        <span className={styles.taskPickHeaderSubtitle}>Pick something concrete and jump straight into focus mode.</span>
                                    </div>
                                    <button type="button" className={styles.taskPickCloseBtn} onClick={() => setOpen(false)} aria-label="Close">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className={styles.taskPickSearchRow}>
                                    <div className={styles.taskPickSearchInputWrap}>
                                        <Search size={15} className={styles.taskPickSearchIcon} />
                                        <input
                                            type="text"
                                            className={styles.taskPickSearchInput}
                                            placeholder="Search tasks…"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className={styles.taskPickFiltersBar}>
                                    <div className={styles.taskPickFilterGrid}>
                                        <div className={`${styles.taskPickField} ${styles.taskPickFilterRow}`}>
                                            <span className={styles.taskPickSortLabel}>Sort</span>
                                            <AnimatedDropdown
                                                value={sortBy}
                                                onChange={(v) => { setSortBy(v); loadTasks(v); }}
                                                options={SORT_OPTIONS}
                                                className={styles.taskPickSortDropdown}
                                            />
                                        </div>
                                        <div className={styles.taskPickField}>
                                            <span className={styles.taskPickSortLabel}>List</span>
                                            <AnimatedDropdown
                                                value={filterListId}
                                                onChange={setFilterListId}
                                                options={listOptions}
                                                placeholder="All lists"
                                                className={styles.taskPickFilterHalf}
                                            />
                                        </div>
                                        <div className={`${styles.taskPickField} ${styles.taskPickFieldCompact}`}>
                                            <span className={styles.taskPickSortLabel}>Module</span>
                                            <AnimatedDropdown
                                                value={filterModuleCode}
                                                onChange={setFilterModuleCode}
                                                options={moduleOptions}
                                                placeholder="All"
                                                className={`${styles.taskPickFilterHalf} ${styles.taskPickModuleFilter}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {loading ? (
                                    <div className={styles.taskPickLoadingState}>
                                        <div className={styles.taskPickLoadingHeader}>
                                            <SkeletonBlock className={styles.taskPickLoadingTitle} />
                                            <SkeletonBlock className={styles.taskPickLoadingMeta} />
                                        </div>
                                        {Array.from({ length: 4 }).map((_, index) => (
                                            <SkeletonBlock key={index} className={styles.taskPickLoadingRow} />
                                        ))}
                                    </div>
                                ) : filteredTasks.length === 0 ? (
                                    <div className={styles.taskPickEmpty}>
                                        <span className={styles.taskPickEmptyIcon}>{searchLower ? '🔍' : '📋'}</span>
                                        <span>{searchLower ? 'No tasks match your search.' : 'No tasks yet. Add some on the Tasks page.'}</span>
                                    </div>
                                ) : (
                                    <div className={styles.taskPickList}>
                                        {filteredTasks.map((task) => {
                                            const duration = `${getTaskDurationMinutes(task)}m`;
                                            const listName = task.list_name || 'Other';
                                            const listColor = task.list_color || '#94a3b8';
                                            const isSelected = value === task.title;
                                            return (
                                                <button
                                                    key={task.id}
                                                    type="button"
                                                    className={`${styles.taskPickItem} ${isSelected ? styles.taskPickItemSelected : ''}`}
                                                    onClick={() => selectTask(task)}
                                                    title={task.title}
                                                    style={{ borderLeft: `3px solid ${listColor}` }}
                                                >
                                                    <div className={styles.taskPickItemContent}>
                                                        <span className={styles.taskPickTitle}>{task.title}</span>
                                                        <span className={styles.taskPickMetaRow}>
                                                            <span
                                                                className={styles.taskPickListPill}
                                                                style={{ background: `${listColor}22`, color: listColor }}
                                                            >
                                                                {listName}
                                                            </span>
                                                            {task.module_code && (
                                                                <span className={styles.taskPickModulePill}>{task.module_code}</span>
                                                            )}
                                                            <span className={styles.taskPickDuration}>{duration}</span>
                                                        </span>
                                                    </div>
                                                    {isSelected && <Check size={14} className={styles.taskPickCheckmark} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
