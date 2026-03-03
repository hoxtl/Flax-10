import styles from "../../pages/Timer/TimerPage.module.css";
import { formatTime } from './TimerComponents';

const OvertimeContent = ({ mode, time, onAction, isLastSession }) => (
    <div className={styles.overtimeContent}>
        <h3>{mode === 'work' ? "Time's Up!" : "Break Over!"}</h3>
        <p>{mode === 'work' ? "You're in overtime mode." : "Time to get back to work."}</p>
        <div className={styles.overtimeTime}>{formatTime(time)}</div>
        <button className={`${styles.button} ${styles.primary}`} onClick={onAction}>
            {mode === 'work' ? (isLastSession ? "Finish Goal" : "Start Break") : "Start Work"}
        </button>
    </div>
);

export const OvertimePopup = ({ mode, time, onAction, isLastSession }) => (
    <div className={styles.overtimePopup}>
        <OvertimeContent mode={mode} time={time} onAction={onAction} isLastSession={isLastSession} />
    </div>
);

export const SummaryPill = ({ label, value, type }) => (
    <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>{label}</span>
        <span className={`${styles.summaryPill} ${styles[`pill${type}`]}`}>
            {value}
        </span>
    </div>
);

const GoalSummary = ({ sessions, workTime, breakTime }) => (
    <div className={styles.summaryContainerWrapper}>
        <p className={styles.summaryText}>You've completed all your scheduled sessions. Amazing work!</p>
        <div className={styles.summaryContainer}>
            <SummaryPill label="✅ Sessions" value={sessions} type="Sessions" />
            <SummaryPill label="🔥 Focus" value={formatTime(workTime)} type="Focus" />
            <SummaryPill label="☕ Break" value={formatTime(breakTime)} type="Break" />
        </div>
    </div>
);

export const GoalModal = ({ sessions, workTime, breakTime, onAction }) => (
    <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
            <div className={styles.modalTitle}>🎉 Goal Reached!</div>
            <GoalSummary sessions={sessions} workTime={workTime} breakTime={breakTime} />
            <button className={`${styles.button} ${styles.primary} ${styles.goalButton}`} onClick={onAction}>
                Start New Goal
            </button>
        </div>
    </div>
);

export const BreakModal = ({ onAction }) => (
    <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
            <div className={styles.modalTitle}>Focus Session Complete!</div>
            <div className={styles.modalMessage}>Great job! Time to take a well-deserved break.</div>
            <button className={`${styles.button} ${styles.primary}`} onClick={onAction}>
                Start Break
            </button>
        </div>
    </div>
);
