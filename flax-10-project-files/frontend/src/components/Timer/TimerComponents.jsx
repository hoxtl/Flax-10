/*
 * Timer feature file.
 */

import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { AnimatePresence, motion } from 'framer-motion';
import PrimaryButton from '../common/primary_button/PrimaryButton';
import styles from '../../pages/timer/TimerPage.module.css';
=======
import styles from '../../pages/Timer/TimerPage.module.css';
import { noiseGenerator } from './utils/noiseUtils';
export { SoundSelector } from './SoundSelector';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

// TaskInput lives in its own file; re-export for any existing imports
export { TaskInput } from './TaskInput';

/** Formats seconds to MM:SS */

export const formatTime = (seconds) => {
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60).toString().padStart(2, '0');
    const s = (abs % 60).toString().padStart(2, '0');
    return `${seconds < 0 ? '+' : ''}${m}:${s}`;
};

export const TimerDisplay = ({ timeLeft, mode, isOvertime }) => {
    const timeText = formatTime(timeLeft);
    const len = timeText.length;
    // Scale font size based on length to prevent overlap with circular rings
    // 5 chars (MM:SS) -> 3.5rem
    // 6 chars (+MM:SS) -> 3.1rem
    // 7+ chars -> 2.6rem
    const fontSize = len > 6 ? '2.6rem' : len > 5 ? '3.1rem' : '3.5rem';
    
    const className = `${styles.timerDisplay} ${mode === 'break' ? styles.break : ''} ${isOvertime ? styles.overtime : ''}`;
    return <div className={className} style={{ fontSize }}>{timeText}</div>;
};


<<<<<<< HEAD
export const getModeText = (mode, isOvertime, isBreakOvertime) => {
=======
const getModeText = (mode, isOvertime, isBreakOvertime) => {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    if (mode === 'work') return isOvertime ? 'Overtime' : 'Focus';
    return isBreakOvertime ? 'Break Overtime' : 'Break';
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
    const variantClassName = !isActive || isPaused ? styles.timerControlBtnStart : styles.timerControlBtnPause;
    const size = !isActive || isPaused ? 'large' : 'medium';

    return <PrimaryButton className={`${styles.timerControlBtn} ${variantClassName}`} onClick={action} size={size} pill>{label}</PrimaryButton>;
};

const BTN_APPEAR = {
    initial: { opacity: 0, x: -6, scale: 0.9 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -6, scale: 0.9 },
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
};

export const TimerControls = ({ isActive, isPaused, onToggle, onPause, onReset, onEndEarly, totalPaused }) => {
<<<<<<< HEAD
    return (
        <div className={styles.controls}>
            <PauseIndicator isPaused={isPaused} totalPaused={totalPaused} />
            <div className={styles.buttonGroup}>
                <PrimaryTimerBtn isActive={isActive} isPaused={isPaused} onToggle={onToggle} onPause={onPause} />
                <AnimatePresence initial={false}>
                    {(isActive || isPaused) && <>
                        <motion.div key="reset-btn" {...BTN_APPEAR} transition={{ ...BTN_APPEAR.transition, delay: 0.04 }}>
                            <PrimaryButton className={`${styles.timerControlBtn} ${styles.timerControlBtnReset}`} variant="danger" onClick={onReset} pill>Reset</PrimaryButton>
                        </motion.div>
                        <motion.div key="end-early-btn" {...BTN_APPEAR} transition={{ ...BTN_APPEAR.transition, delay: 0.09 }}>
                            <PrimaryButton className={`${styles.timerControlBtn} ${styles.timerControlBtnEndEarly}`} variant="ghost" onClick={onEndEarly} pill>End Early</PrimaryButton>
                        </motion.div>
                    </>}
                </AnimatePresence>
            </div>
=======
    const actns = isActive || isPaused
        ? <><PrimaryTimerBtn isActive={isActive} isPaused={isPaused} onToggle={onToggle} onPause={onPause} /><button className={`${styles.button} ${styles.danger}`} onClick={onReset}>Reset</button><button className={`${styles.button} ${styles.danger} ${styles.outline}`} onClick={onEndEarly}>End Early</button></>
        : <PrimaryTimerBtn isActive={isActive} isPaused={isPaused} onToggle={onToggle} onPause={onPause} />;
    return (
        <div className={styles.controls}>
            <PauseIndicator isPaused={isPaused} totalPaused={totalPaused} />
            <div className={styles.buttonGroup}>{actns}</div>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        </div>
    );
};

<<<<<<< HEAD
export const handleInput = (e, min, setLocal, onError) => {
=======
const handleInput = (e, min, setLocal, onError) => {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    const num = parseInt(e.target.value);
    const isMin = !isNaN(num) && num < min;
    setLocal(isMin ? min : e.target.value);
    if (onError) onError(isMin);
};

export const commitInput = (local, value, min, setLocal, onUpdate, onError) => {
    const final = Math.max(parseInt(local) || min, min);
    setLocal(final);
    if (final !== value) onUpdate(final);
    if (onError) onError(false);
};

<<<<<<< HEAD
export const handleKey = (e, local, min, onError) => {
=======
const handleKey = (e, local, min, onError) => {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    if (e.key === 'Enter') return e.target.blur();
    if (e.key !== 'ArrowDown') return;
    if (local !== '' && parseInt(local) > min) return;
    e.preventDefault();
    if (onError) onError(true);
};

const useBufferedInput = (value, onUpdate, min, onError) => {
    const [local, setLocal] = useState(value);
    useEffect(() => setLocal(value), [value]);
    return {
        local,
        onChange: (e) => handleInput(e, min, setLocal, onError),
        onBlur: () => commitInput(local, value, min, setLocal, onUpdate, onError),
        onKeyDown: (e) => handleKey(e, local, min, onError),
    };
};

const BufferedInput = ({ label, value, disabled, ...props }) => {
    const { local, onChange, onBlur, onKeyDown } = useBufferedInput(value, props.onUpdate, props.min, props.onError);
    return (
        <div className={styles.settingItem}>
            <label className={styles.label}>{label}</label>
            <input type="number" className={styles.input} value={local} onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} onFocus={(e) => e.target.select()} disabled={disabled} />
<<<<<<< HEAD
        </div>
    );
};

export const TimerSettings = ({ work, breakTime, sessions, onUpdate, disabled }) => {
    const [showError, setShowError] = useState(false);
    return (
        <div className={styles.settingsContainer}>
            <div className={styles.settings}>
                <BufferedInput label="Work (min)" value={work} min={1} onUpdate={(v) => onUpdate('work', v)} onError={setShowError} disabled={disabled} />
                <BufferedInput label="Break (min)" value={breakTime} min={0} onUpdate={(v) => onUpdate('break', v)} disabled={disabled} />
                <BufferedInput label="Sessions" value={sessions} min={1} onUpdate={(v) => onUpdate('sessions', v)} disabled={disabled} />
            </div>
            {showError && <div className={styles.disclaimer}>* Minimum study time is 1 minute</div>}
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        </div>
    );
};

export const TimerSettings = ({ work, breakTime, sessions, onUpdate, disabled }) => {
    const [showError, setShowError] = useState(false);
    return (
        <div className={styles.settingsContainer}>
            <div className={styles.settings}>
                <BufferedInput label="Work (min)" value={work} min={1} onUpdate={(v) => onUpdate('work', v)} onError={setShowError} disabled={disabled} />
                <BufferedInput label="Break (min)" value={breakTime} min={0} onUpdate={(v) => onUpdate('break', v)} disabled={disabled} />
                <BufferedInput label="Sessions" value={sessions} min={1} onUpdate={(v) => onUpdate('sessions', v)} disabled={disabled} />
            </div>
            {showError && <div className={styles.disclaimer}>* Minimum study time is 1 minute</div>}
        </div>
    );
};

const applyNoise = (noiseType, volume) => {
    if (noiseType === 'none') return noiseGenerator.stop();
    noiseGenerator.play(noiseType);
    noiseGenerator.setVolume(volume);
};

export const useAmbientSound = () => {
    const [noiseType, setNoiseType] = useState('none');
    const [volume, setVolume] = useState(0.5);
    useEffect(() => {
        applyNoise(noiseType, volume);
        return () => noiseGenerator.stop();
    }, [noiseType, volume]);
    const toggle = (value) => setNoiseType((prev) => prev === value ? 'none' : value);
    return { noiseType, toggle, volume, setVolume };
};
