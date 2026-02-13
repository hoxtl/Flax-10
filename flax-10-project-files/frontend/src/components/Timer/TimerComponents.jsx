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

const SettingItem = ({ label, value, onChange, onBlur }) => (
    <div className={styles.settingItem}>
        <label className={styles.label}>{label}</label>
        <Input value={value} onChange={onChange} onBlur={onBlur} />
    </div>
);

const getChangeHandler = (onUpdate, type) => (e) =>
    onUpdate(type, e.target.value === '' ? '' : parseInt(e.target.value));

const getBlurHandler = (onUpdate, type, val, def) => () =>
    (val === '' || isNaN(val) || val < (type === 'sessions' ? 1 : 0)) && onUpdate(type, def);

export const TimerSettings = ({ work, breakTime, sessions, onUpdate }) => (
    <div className={styles.settings}>
        <SettingItem label="Work (min)" value={work} onChange={getChangeHandler(onUpdate, 'work')} onBlur={getBlurHandler(onUpdate, 'work', work, 0)} />
        <SettingItem label="Break (min)" value={breakTime} onChange={getChangeHandler(onUpdate, 'break')} onBlur={getBlurHandler(onUpdate, 'break', breakTime, 0)} />
        <SettingItem label="Sessions" value={sessions} onChange={getChangeHandler(onUpdate, 'sessions')} onBlur={getBlurHandler(onUpdate, 'sessions', sessions, 1)} />
    </div>
);
