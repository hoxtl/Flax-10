import { useState, useEffect } from 'react';
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

const SoundOptions = () => (
    <>
        <option value="none">None 🔇</option>
        <option value="white">White Noise 🌊</option>
        <option value="pink">Pink Noise 🌧️</option>
        <option value="brown">Brown Noise 🏔️</option>
    </>
);

const SoundControls = ({ noiseType, setNoiseType }) => {
    const lbl = <span className={styles.label}>Calming Sound:</span>;
    const sel = <select className={styles.soundSelect} value={noiseType} onChange={(e) => setNoiseType(e.target.value)}><SoundOptions /></select>;
    return <div className={styles.soundControls}>{lbl}{sel}</div>;
};

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
    const ctrl = <SoundControls noiseType={noiseType} setNoiseType={setNoiseType} />;
    return <div className={styles.soundSelectorContainer}>{ctrl}</div>;
};

const handleTaskKey = (e) => {
    if (e.key === 'Enter') e.target.blur();
};

export const TaskInput = ({ value, onChange }) => {
    const inp = <input type="text" className={styles.taskInput} placeholder="What are you working on? 🎯" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={handleTaskKey} />;
    return <div className={styles.taskInputContainer}>{inp}</div>;
};