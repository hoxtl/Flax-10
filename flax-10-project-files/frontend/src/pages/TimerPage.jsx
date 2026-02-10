import { useState, useEffect, useRef } from 'react';
import styles from './TimerPage.module.css';
import TreeAnimation from '../components/TreeAnimation';

export default function TimerPage() {
    const [workTime, setWorkTime] = useState(25);
    const [breakTime, setBreakTime] = useState(5);
    const [targetSessions, setTargetSessions] = useState(4);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('work'); // 'work' | 'break'
    const [modal, setModal] = useState(null); // { title, message, actionLabel, onAction }
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    // If in break mode, stop at 0
                    if (mode === 'break' && prev <= 0) {
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, mode]);

    // Handle break completion separately
    useEffect(() => {
        if (mode === 'break' && timeLeft === 0 && isActive) {
            handleTimerComplete();
        }
    }, [mode, timeLeft, isActive]);

    const handleTimerComplete = () => {
        setIsActive(false);

        if (mode === 'work') {
            if (breakTime === 0) {
                // Skip break if 0
                completeSessionAndContinue();
            } else {
                setModal({
                    title: "Focus Session Complete!",
                    message: "Great job! Time to take a well-deserved break.",
                    actionLabel: "Start Break",
                    onAction: () => {
                        setMode('break');
                        setTimeLeft(breakTime * 60);
                        setIsActive(true); // Start break timer automatically? User usually wants to start it themselves? 
                        // Actually, let's start it.
                        setModal(null);
                    }
                });
            }
        } else {
            // Break done
            const newCompleted = completedSessions + 1;
            setCompletedSessions(newCompleted);

            if (newCompleted >= targetSessions) {
                setModal({
                    title: "🎉 Goal Reached!",
                    message: "You've completed all your scheduled sessions. Amazing work!",
                    actionLabel: "Start New Goal",
                    onAction: () => {
                        setMode('work');
                        setTimeLeft(workTime * 60);
                        setCompletedSessions(0);
                        setModal(null);
                    }
                });
                return;
            }

            setModal({
                title: "Break Over",
                message: "Ready to get back to focus?",
                actionLabel: "Start Work",
                onAction: () => {
                    setMode('work');
                    setTimeLeft(workTime * 60);
                    setModal(null);
                    // Let user start manually
                }
            });
        }
    };

    const completeSessionAndContinue = () => {
        const newCompleted = completedSessions + 1;
        setCompletedSessions(newCompleted);

        if (newCompleted >= targetSessions) {
            setModal({
                title: "🎉 Goal Reached!",
                message: "You've completed all your scheduled sessions. Amazing work!",
                actionLabel: "Start New Goal",
                onAction: () => {
                    setMode('work');
                    setTimeLeft(workTime * 60);
                    setCompletedSessions(0);
                    setModal(null);
                }
            });
            return;
        }

        setMode('work');
        setTimeLeft(workTime * 60);
        setIsActive(false); // Pause so they can start when ready
    };

    const handleStartBreak = () => {
        setIsActive(false);
        if (breakTime === 0) {
            completeSessionAndContinue();
        } else {
            setMode('break');
            setTimeLeft(breakTime * 60);
            setIsActive(true);
        }
    };

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setMode('work');
        setTimeLeft(workTime * 60);
        setCompletedSessions(0);
        setModal(null);
    };

    const handleTimeChange = (type, value) => {
        const val = parseInt(value) || 0;
        if (type === 'work') {
            const newVal = Math.max(1, Math.min(180, val));
            setWorkTime(newVal);
            if (mode === 'work' && !isActive) setTimeLeft(newVal * 60);
        } else if (type === 'break') {
            const newVal = Math.max(0, Math.min(60, val));
            setBreakTime(newVal);
            if (mode === 'break' && !isActive) setTimeLeft(newVal * 60);
        } else if (type === 'sessions') {
            setTargetSessions(Math.max(1, parseInt(value) || 1));
        }
    };

    const formatTime = (seconds) => {
        const absSeconds = Math.abs(seconds);
        const mins = Math.floor(absSeconds / 60);
        const secs = absSeconds % 60;
        const sign = seconds < 0 ? '+' : '';
        return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress for the current session
    let currentSessionFraction = 0;
    if (mode === 'work') {
        const totalSeconds = workTime * 60;
        // Cap progress at 100% even if overtime
        currentSessionFraction = Math.min(1, Math.max(0, (totalSeconds - timeLeft) / totalSeconds));
    }

    // Progress = (Completed Sessions + Current Session Progress) / Total Goal
    const overallProgress = Math.min(100, ((completedSessions + (mode === 'work' ? currentSessionFraction : 0)) / targetSessions) * 100);

    const isOvertime = mode === 'work' && timeLeft < 0;

    return (
        <div className={styles.container}>
            <div className={styles.title}>Study Timer</div>

            <TreeAnimation progress={overallProgress} mode={mode} />

            <div className={`${styles.modeIndicator} ${mode === 'break' ? styles.break : ''}`}>
                {mode === 'work' ? (isOvertime ? '🚀 Overtime' : '🔥 Focus Time') : '☕ Break Time'}
            </div>

            <div className={styles.sessionStatus}>
                Session {completedSessions + 1} of {targetSessions}
            </div>

            <div className={`${styles.timerDisplay} ${mode === 'break' ? styles.break : ''} ${isOvertime ? styles.overtime : ''}`}>
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
                <div className={styles.settingItem}>
                    <label className={styles.label}>Sessions</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={targetSessions}
                        onChange={(e) => handleTimeChange('sessions', e.target.value)}
                        disabled={isActive}
                    />
                </div>
            </div>

            {isOvertime && (
                <div className={styles.overtimePopup}>
                    <div className={styles.overtimeContent}>
                        <h3>Time's Up!</h3>
                        <p>You're in overtime mode.</p>
                        <div className={styles.overtimeTime}>{formatTime(timeLeft)}</div>
                        <button className={`${styles.button} ${styles.primary}`} onClick={handleStartBreak}>
                            Start Break
                        </button>
                    </div>
                </div>
            )}

            {modal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalTitle}>{modal.title}</div>
                        <div className={styles.modalMessage}>{modal.message}</div>
                        <button
                            className={`${styles.button} ${styles.primary}`}
                            onClick={modal.onAction}
                        >
                            {modal.actionLabel}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
