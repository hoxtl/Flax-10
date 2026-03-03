import styles from "../../pages/Timer/TimerPage.module.css";
import { formatTime } from './TimerComponents';

const OvertimeContent = ({ mode, time, onAction, isLastSession }) => {
    const title = <h3>{mode === 'work' ? "Time's Up!" : "Break Over!"}</h3>;
    const subtitle = <p>{mode === 'work' ? "You're in overtime mode." : "Time to get back to work."}</p>;
    const timeDiv = <div className={styles.overtimeTime}>{formatTime(time)}</div>;
    const btnLabel = mode === 'work' ? (isLastSession ? "Finish Goal" : "Start Break") : "Start Work";
    const btn = <button className={`${styles.button} ${styles.primary}`} onClick={onAction}>{btnLabel}</button>;
    return <div className={styles.overtimeContent}>{title}{subtitle}{timeDiv}{btn}</div>;
};

export const OvertimePopup = ({ mode, time, onAction, isLastSession }) => {
    const content = <OvertimeContent mode={mode} time={time} onAction={onAction} isLastSession={isLastSession} />;
    return <div className={styles.overtimePopup}>{content}</div>;
};

export const SummaryPill = ({ label, value, type }) => {
    const lbl = <span className={styles.summaryLabel}>{label}</span>;
    const val = <span className={`${styles.summaryPill} ${styles[`pill${type}`]}`}>{value}</span>;
    return <div className={styles.summaryItem}>{lbl}{val}</div>;
};

const GoalSummary = ({ sessions, workTime, breakTime }) => {
    const title = <p className={styles.summaryText}>You've completed all your scheduled sessions. Amazing work!</p>;
    const sPill = <SummaryPill label="✅ Sessions" value={sessions} type="Sessions" />;
    const fPill = <SummaryPill label="🔥 Focus" value={formatTime(workTime)} type="Focus" />;
    const bPill = <SummaryPill label="☕ Break" value={formatTime(breakTime)} type="Break" />;
    const container = <div className={styles.summaryContainer}>{sPill}{fPill}{bPill}</div>;
    return <div className={styles.summaryContainerWrapper}>{title}{container}</div>;
};

export const GoalModal = ({ sessions, workTime, breakTime, onAction }) => {
    const title = <div className={styles.modalTitle}>🎉 Goal Reached!</div>;
    const summary = <GoalSummary sessions={sessions} workTime={workTime} breakTime={breakTime} />;
    const btn = <button className={`${styles.button} ${styles.primary} ${styles.goalButton}`} onClick={onAction}>Start New Goal</button>;
    const content = <div className={styles.modalContent}>{title}{summary}{btn}</div>;
    return <div className={styles.modalOverlay}>{content}</div>;
};

export const BreakModal = ({ onAction }) => {
    const title = <div className={styles.modalTitle}>Focus Session Complete!</div>;
    const msg = <div className={styles.modalMessage}>Great job! Time to take a well-deserved break.</div>;
    const btn = <button className={`${styles.button} ${styles.primary}`} onClick={onAction}>Start Break</button>;
    const content = <div className={styles.modalContent}>{title}{msg}{btn}</div>;
    return <div className={styles.modalOverlay}>{content}</div>;
};

export const LeaveTimerModal = ({ onCancel, onPause, onExit }) => {
    const title = <div className={styles.modalTitle}>Leave focus time?</div>;
    const msg = <div className={`${styles.modalMessage} ${styles.leaveModalMessage}`}>Your timer is still running.</div>;
    const pBtn = <button className={`${styles.button} ${styles.primary}`} onClick={onPause}>Pause Timer</button>;
    const eBtn = <button className={`${styles.button} ${styles.leaveBtnExit}`} onClick={onExit}>Exit</button>;
    const cBtn = <button className={`${styles.button} ${styles.leaveBtnCancel}`} onClick={onCancel}>Cancel</button>;
    const btns = <div className={styles.leaveModalButtons}>{pBtn}{eBtn}{cBtn}</div>;
    const content = <div className={styles.modalContent}>{title}{msg}{btns}</div>;
    return <div className={`${styles.modalOverlay} ${styles.leaveModalOverlay}`}>{content}</div>;
};
