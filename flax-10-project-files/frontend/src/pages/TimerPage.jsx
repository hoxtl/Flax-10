import { useState, useEffect, useRef } from 'react';
import styles from './TimerPage.module.css';

export default function TimerPage() {
    const [workTime, setWorkTime] = useState(25);
    const [breakTime, setBreakTime] = useState(5);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('work'); // 'work' | 'break'
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        setIsActive(false);
        // Play notification sound here if we had one
        if (mode === 'work') {
            alert("Work session complete! Time for a break.");
            setMode('break');
            setTimeLeft(breakTime * 60);
        } else {
            alert("Break over! Time to focus.");
            setMode('work');
            setTimeLeft(workTime * 60);
        }
    };

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setMode('work');
        setTimeLeft(workTime * 60);
    };

    const handleTimeChange = (type, value) => {
        const newVal = Math.max(1, Math.min(180, parseInt(value) || 1));
        if (type === 'work') {
            setWorkTime(newVal);
            if (mode === 'work' && !isActive) setTimeLeft(newVal * 60);
        } else {
            setBreakTime(newVal);
            if (mode === 'break' && !isActive) setTimeLeft(newVal * 60);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = mode === 'work'
        ? ((workTime * 60 - timeLeft) / (workTime * 60)) * 100
        : ((breakTime * 60 - timeLeft) / (breakTime * 60)) * 100;

    return (
        <div className={styles.container}>
            <div className={styles.title}>Study Timer</div>

            <div className={`${styles.modeIndicator} ${mode === 'break' ? styles.break : ''}`}>
                {mode === 'work' ? '🔥 Focus Time' : '☕ Break Time'}
            </div>

            <div className={`${styles.timerDisplay} ${mode === 'break' ? styles.break : ''}`}>
                {formatTime(timeLeft)}
            </div>

            <div className={styles.controls}>
                <button
                    className={`${styles.button} ${styles.primary}`}
                    onClick={toggleTimer}
                >
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button
                    className={`${styles.button} ${styles.danger}`}
                    onClick={resetTimer}
                >
                    Reset
                </button>
            </div>

            <div className={styles.settings}>
                <div className={styles.settingItem}>
                    <label className={styles.label}>Work (min)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={workTime}
                        onChange={(e) => handleTimeChange('work', e.target.value)}
                        disabled={isActive}
                    />
                </div>
                <div className={styles.settingItem}>
                    <label className={styles.label}>Break (min)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={breakTime}
                        onChange={(e) => handleTimeChange('break', e.target.value)}
                        disabled={isActive}
                    />
                </div>
            </div>
        </div>
    );
}
