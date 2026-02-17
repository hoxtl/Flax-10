import { useState, useEffect } from 'react';
import styles from '../../pages/TimerPage.module.css';

/** Formats seconds to MM:SS. Handles negative values with '+' for overtime */
export const formatTime = (seconds) => {
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60).toString().padStart(2, '0');
    const s = (abs % 60).toString().padStart(2, '0');
    return `${seconds < 0 ? '+' : ''}${m}:${s}`;
};

export const TimerDisplay = ({ timeLeft, mode, isOvertime }) => (
    <div className={`${styles.timerDisplay} ${mode === 'break' ? styles.break : ''} ${isOvertime ? styles.overtime : ''}`}>
        {formatTime(timeLeft)}
    </div>
);

export const ModeIndicator = ({ mode, isOvertime, isBreakOvertime }) => (
    <div className={`${styles.modeIndicator} ${mode === 'break' ? styles.break : ''}`}>
        {mode === 'work' ? (isOvertime ? '🚀 Overtime' : '🔥 Focus Time') : (isBreakOvertime ? '⏳ Break Overtime' : '☕ Break Time')}
    </div>
);

export const SessionStatus = ({ current, total }) => (
    <div className={styles.sessionStatus}>
        Session {current + 1} of {total}
    </div>
);

export const TimerControls = ({ isActive, onToggle, onReset }) => (
    <div className={styles.controls}>
        <button className={`${styles.button} ${styles.primary}`} onClick={onToggle}>
            {isActive ? 'Pause' : 'Start'}
        </button>
        <button className={`${styles.button} ${styles.danger}`} onClick={onReset}>
            Reset
        </button>
    </div>
);

const useBufferedInput = (value, onUpdate, min, onError) => {
    const [local, setLocal] = useState(value);
    useEffect(() => setLocal(value), [value]);

    const handleChange = (e) => {
        const num = parseInt(e.target.value);
        const isMin = !isNaN(num) && num < min;
        setLocal(isMin ? min : e.target.value);
        onError && onError(isMin);
    };

    const commit = () => {
        const final = Math.max(parseInt(local) || min, min);
        setLocal(final);
        if (final !== value) onUpdate(final);
        onError && onError(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') e.target.blur();
        if (e.key === 'ArrowDown' && (local === '' || parseInt(local) <= min)) {
            e.preventDefault();
            onError && onError(true);
        }
    };
    return { local, handleChange, commit, handleKeyDown };
};

const BufferedInput = ({ label, value, ...props }) => {
    const { local, handleChange, commit, handleKeyDown } = useBufferedInput(value, props.onUpdate, props.min, props.onError);
    return (
        <div className={styles.settingItem}>
            <label className={styles.label}>{label}</label>
            <input type="number" className={styles.input} value={local}
                onChange={handleChange} onBlur={commit} onKeyDown={handleKeyDown} onFocus={(e) => e.target.select()} />
        </div>
    );
};

const Disclaimer = ({ show }) => show ? (
    <div className={styles.disclaimer} style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7, textAlign: 'center', color: '#ef4444' }}>
        * Minimum study time is 1 minute
    </div>
) : null;

export const TimerSettings = ({ work, breakTime, sessions, onUpdate }) => {
    const [showError, setShowError] = useState(false);
    return (
        <div className={styles.settingsContainer}>
            <div className={styles.settings}>
                <BufferedInput label="Work (min)" value={work} min={1} onUpdate={(v) => onUpdate('work', v)} onError={setShowError} />
                <BufferedInput label="Break (min)" value={breakTime} min={0} onUpdate={(v) => onUpdate('break', v)} />
                <BufferedInput label="Sessions" value={sessions} min={1} onUpdate={(v) => onUpdate('sessions', v)} />
            </div>
            <Disclaimer show={showError} />
        </div>
    );
};

import { noiseGenerator } from '../../utils/noiseUtils';

export const SoundSelector = () => {
    const [noiseType, setNoiseType] = useState('none');

    useEffect(() => {
        if (noiseType === 'none') {
            noiseGenerator.stop();
        } else {
            noiseGenerator.play(noiseType);
            noiseGenerator.setVolume(0.5); // Default comfortable volume
        }
        return () => noiseGenerator.stop();
    }, [noiseType]);

    return (
        <div className={styles.soundSelectorContainer}>
            <div className={styles.soundControls}>
                <span className={styles.label}>Calming Sound:</span>
                <select
                    className={styles.soundSelect}
                    value={noiseType}
                    onChange={(e) => setNoiseType(e.target.value)}
                >
                    <option value="none">None 🔇</option>
                    <option value="white">White Noise 🌊</option>
                    <option value="pink">Pink Noise 🌧️</option>
                    <option value="brown">Brown Noise 🏔️</option>
                </select>
            </div>
        </div>
    );
};

export const TaskInput = ({ value, onChange }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    return (
        <div className={styles.taskInputContainer}>
            <input
                type="text"
                className={styles.taskInput}
                placeholder="What are you working on? 🎯"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
};
