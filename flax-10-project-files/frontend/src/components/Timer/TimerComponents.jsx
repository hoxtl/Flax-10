import { useState, useEffect, useRef, useCallback } from 'react';
import styles from "../../pages/Timer/TimerPage.module.css";
import { noiseGenerator } from './utils/noiseUtils';

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

/** Action buttons for timer */
export const TimerControls = ({ isActive, onToggle, onReset }) => (
    <div className={styles.controls}>
        <button className={`${styles.button} ${styles.primary}`} onClick={onToggle}>{isActive ? 'Pause' : 'Start'}</button>
        <button className={`${styles.button} ${styles.danger}`} onClick={onReset}>Reset</button>
    </div>
);

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

/** Task input with optional pick-from-tasks list (sorted by urgency, auto-start on select) */
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

export const TaskInput = ({ value, onChange, onTaskSelect }) => {
    const [open, setOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    const loadTasks = useCallback(() => {
        setLoading(true);
        import('../../api/taskService').then(({ fetchTasks }) =>
            fetchTasks()
                .then((data) => {
                    const list = (data || []).filter((t) => !t.completed);
                    list.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4));
                    setTasks(list.slice(0, 25));
                })
                .catch(() => setTasks([]))
                .finally(() => setLoading(false))
        );
    }, []);

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

    return (
        <div className={styles.taskInputWrap}>
            <div className={styles.taskInputContainer} ref={ref}>
                <input
                    type="text"
                    className={styles.taskInput}
                    placeholder="What are you working on? 🎯"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleTaskKey}
                />
                <div className={styles.taskInputActions}>
                    <span className={styles.taskInputHint}>Pick a task to start focused work</span>
                    <button
                        type="button"
                        className={styles.taskPickBtn}
                        onClick={handleOpen}
                        title="Pick from your tasks (sorted by urgency)"
                    >
                        Pick task
                    </button>
                </div>
                {open && (
                    <div className={styles.taskPickDropdown}>
                        <div className={styles.taskPickHeader}>Sort by urgency</div>
                        {loading ? (
                            <div className={styles.taskPickEmpty}>Loading…</div>
                        ) : tasks.length === 0 ? (
                            <div className={styles.taskPickEmpty}>No tasks. Add some on the Tasks page.</div>
                        ) : (
                            tasks.map((task) => (
                                <button
                                    key={task.id}
                                    type="button"
                                    className={`${styles.taskPickItem} ${value === task.title ? styles.taskPickItemSelected : ''}`}
                                    onClick={() => selectTask(task)}
                                >
                                    <span className={styles.taskPickTitle}>{task.title}</span>
                                    <span className={styles.taskPickMeta}>
                                        {task.priority && <span className={styles.taskPickPriority}>{task.priority}</span>}
                                        {task.estimated_blocks && (
                                            <span className={styles.taskPickEst}>{task.estimated_blocks * 25}m</span>
                                        )}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};