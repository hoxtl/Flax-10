import styles from '../../pages/TimerPage.module.css';

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

const Input = ({ value, onChange, onBlur }) => (
    <input type="number" className={styles.input} value={value}
        onChange={onChange} onFocus={(e) => e.target.select()} onBlur={onBlur} />
);

export const TimerSettings = ({ work, breakTime, sessions, onUpdate, isActive }) => {
    const handleChange = (type) => (e) => {
        const val = e.target.value;
        onUpdate(type, val === '' ? '' : parseInt(val));
    };
    const handleBlur = (type, val, def) => () => {
        if (val === '' || isNaN(val) || (type === 'sessions' && val < 1))
            onUpdate(type, def);
    };

    return (
        <div className={styles.settings}>
            <div className={styles.settingItem}>
                <label className={styles.label}>Work (min)</label>
                <Input value={work} onChange={handleChange('work')} onBlur={handleBlur('work', work, 0)} />
            </div>
            <div className={styles.settingItem}>
                <label className={styles.label}>Break (min)</label>
                <Input value={breakTime} onChange={handleChange('break')} onBlur={handleBlur('break', breakTime, 0)} />
            </div>
            <div className={styles.settingItem}>
                <label className={styles.label}>Sessions</label>
                <Input value={sessions} onChange={handleChange('sessions')} onBlur={handleBlur('sessions', sessions, 1)} />
            </div>
        </div>
    );
};
