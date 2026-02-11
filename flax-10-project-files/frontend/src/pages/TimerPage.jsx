import { useState, useEffect, useRef } from 'react';
import styles from './TimerPage.module.css';
import TreeAnimation from '../components/TreeAnimation';

export default function TimerPage() {
    const [workTime, setWorkTime] = useState(25);
    const [breakTime, setBreakTime] = useState(5);
    const [targetSessions, setTargetSessions] = useState(4);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [totalWorkSeconds, setTotalWorkSeconds] = useState(0);
    const [totalBreakSeconds, setTotalBreakSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('work'); // 'work' | 'break'
    const [modal, setModal] = useState(null); // { title, message, actionLabel, onAction }
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    return prev - 1;
                });
                if (mode === 'work') {
                    setTotalWorkSeconds((prev) => prev + 1);
                } else if (mode === 'break') {
                    setTotalBreakSeconds((prev) => prev + 1);
                }
            }, 1000);
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, mode]);

    // Handle break completion separately - DISABLED to allow overtime
    // useEffect(() => {
    //     if (mode === 'break' && timeLeft === 0 && isActive) {
    //         handleTimerComplete();
    //     }
    // }, [mode, timeLeft, isActive]);

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
                        setIsActive(true);
                        setModal(null);
                    }
                });
            }
        }
    };

    const startWork = () => {
        const newCompleted = completedSessions + 1;
        setCompletedSessions(newCompleted);

        if (newCompleted >= targetSessions) {
            setModal({
                title: "🎉 Goal Reached!",
                message: (
                    <div className={styles.summaryContainerWrapper}>
                        <p className={styles.summaryText}>You've completed all your scheduled sessions. Amazing work!</p>
                        <div className={styles.summaryContainer}>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>✅ Sessions</span>
                                <span className={`${styles.summaryPill} ${styles.pillSessions}`}>
                                    {newCompleted}
                                </span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>🔥 Focus</span>
                                <span className={`${styles.summaryPill} ${styles.pillFocus}`}>
                                    {formatTime(totalWorkSeconds)}
                                </span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>☕ Break</span>
                                <span className={`${styles.summaryPill} ${styles.pillBreak}`}>
                                    {formatTime(totalBreakSeconds)}
                                </span>
                            </div>
                        </div>
                    </div>
                ),
                actionLabel: "Start New Goal",
                onAction: () => {
                    setMode('work');
                    setTimeLeft(workTime * 60);
                    setCompletedSessions(0);
                    setTotalWorkSeconds(0);
                    setTotalBreakSeconds(0);
                    setIsActive(false);
                    setModal(null);
                }
            });
            return;
        }

        setMode('work');
        setTimeLeft(workTime * 60);
        setIsActive(true);
    };

    const completeSessionAndContinue = () => {
        const newCompleted = completedSessions + 1;
        setCompletedSessions(newCompleted);

        if (newCompleted >= targetSessions) {
            setModal({
                title: "🎉 Goal Reached!",
                message: (
                    <div className={styles.summaryContainerWrapper}>
                        <p className={styles.summaryText}>You've completed all your scheduled sessions. Amazing work!</p>
                        <div className={styles.summaryContainer}>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>✅ Sessions</span>
                                <span className={`${styles.summaryPill} ${styles.pillSessions}`}>
                                    {newCompleted}
                                </span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>🔥 Focus</span>
                                <span className={`${styles.summaryPill} ${styles.pillFocus}`}>
                                    {formatTime(totalWorkSeconds)}
                                </span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>☕ Break</span>
                                <span className={`${styles.summaryPill} ${styles.pillBreak}`}>
                                    {formatTime(totalBreakSeconds)}
                                </span>
                            </div>
                        </div>
                    </div>
                ),
                actionLabel: "Start New Goal",
                onAction: () => {
                    setMode('work');
                    setTimeLeft(workTime * 60);
                    setCompletedSessions(0);
                    setTotalWorkSeconds(0);
                    setTotalBreakSeconds(0);
                    setIsActive(false);
                    setModal(null);
                }
            });
            return;
        }

        setMode('work');
        setTimeLeft(workTime * 60);
        setIsActive(false);
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
        setTotalWorkSeconds(0);
        setTotalBreakSeconds(0);
        setModal(null);
    };

    const handleTimeChange = (type, value) => {
        // Allow empty string to clear input
        if (value === '') {
            if (type === 'work') setWorkTime('');
            else if (type === 'break') setBreakTime('');
            else if (type === 'sessions') setTargetSessions('');
            return;
        }

        const val = parseInt(value);
        if (isNaN(val)) return;

        if (type === 'work') {
            const newVal = Math.max(0, val);
            setWorkTime(newVal);
            if (mode === 'work' && !isActive) setTimeLeft(newVal * 60);
        } else if (type === 'break') {
            const newVal = Math.max(0, val);
            setBreakTime(newVal);
            if (mode === 'break' && !isActive) setTimeLeft(newVal * 60);
        } else if (type === 'sessions') {
            setTargetSessions(Math.max(1, val));
        }
    };

    const handleBlur = (type) => {
        if (type === 'work') {
            if (workTime === '' || isNaN(workTime)) {
                setWorkTime(0); // Default to 0
                if (mode === 'work' && !isActive) setTimeLeft(0);
            }
        } else if (type === 'break') {
            if (breakTime === '' || isNaN(breakTime)) {
                setBreakTime(0); // Default to 0
                if (mode === 'break' && !isActive) setTimeLeft(0);
            }
        } else if (type === 'sessions') {
            if (targetSessions === '' || isNaN(targetSessions) || targetSessions < 1) {
                setTargetSessions(1); // Default to 1
            }
        }
    };

    const formatTime = (seconds) => {
        const absSeconds = Math.abs(seconds);
        const mins = Math.floor(absSeconds / 60);
        const secs = absSeconds % 60;
        const sign = seconds < 0 ? '+' : '';
        return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress for the current session (grow tree per session)
    let sessionProgress = 0;
    if (mode === 'work') {
        const totalSeconds = workTime * 60;
        const fraction = Math.min(1, Math.max(0, (totalSeconds - timeLeft) / totalSeconds));
        sessionProgress = fraction * 100;

        // Ensure it hits 100% exactly when finished (or in overtime)
        if (timeLeft <= 0) sessionProgress = 100;
    } else {
        // During break, show full tree
        sessionProgress = 100;
    }

    const isOvertime = mode === 'work' && timeLeft < 0;
    const isBreakOvertime = mode === 'break' && timeLeft < 0;

    return (
        <div className={styles.container}>
            <div className={styles.title}>Study Timer</div>

            <TreeAnimation progress={sessionProgress} mode={mode} />

            <div className={`${styles.modeIndicator} ${mode === 'break' ? styles.break : ''}`}>
                {mode === 'work' ? (isOvertime ? '🚀 Overtime' : '🔥 Focus Time') : (isBreakOvertime ? '⏳ Break Overtime' : '☕ Break Time')}
            </div>

            <div className={styles.sessionStatus}>
                Session {completedSessions + 1} of {targetSessions}
            </div>

            <div className={`${styles.timerDisplay} ${mode === 'break' ? styles.break : ''} ${isOvertime || isBreakOvertime ? styles.overtime : ''}`}>
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
                        onFocus={(e) => e.target.select()}
                        onBlur={() => handleBlur('work')}
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
                        onFocus={(e) => e.target.select()}
                        onBlur={() => handleBlur('break')}
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
                        onFocus={(e) => e.target.select()}
                        onBlur={() => handleBlur('sessions')}
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

            {isBreakOvertime && (
                <div className={styles.overtimePopup}>
                    <div className={styles.overtimeContent}>
                        <h3>Break Over!</h3>
                        <p>Time to get back to work.</p>
                        <div className={styles.overtimeTime}>{formatTime(timeLeft)}</div>
                        <button className={`${styles.button} ${styles.primary}`} onClick={startWork}>
                            Start Work
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
