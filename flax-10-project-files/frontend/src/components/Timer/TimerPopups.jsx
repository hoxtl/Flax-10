import styles from "../../pages/Timer/TimerPage.module.css";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import StandardModal from "../common/StandardModal/StandardModal";
import { formatTime } from './TimerComponents';

const OvertimeContent = ({ mode, time, onAction, isLastSession }) => {
    const title = <h3>{mode === 'work' ? "Time's Up!" : "Break Over!"}</h3>;
    const subtitle = <p>{mode === 'work' ? "You're in overtime mode." : "Time to get back to work."}</p>;
    const timeDiv = <div className={styles.overtimeTime}>{formatTime(time)}</div>;
    const btnLabel = mode === 'work' ? (isLastSession ? "Finish Goal" : "Start Break") : "Start Work";
    const btn = <PrimaryButton className={`${styles.button} ${styles.primary}`} onClick={onAction} pill>{btnLabel}</PrimaryButton>;
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
    const title = "Goal reached";
    const summary = <GoalSummary sessions={sessions} workTime={workTime} breakTime={breakTime} />;
    const btn = <PrimaryButton className={`${styles.button} ${styles.primary} ${styles.goalButton}`} onClick={onAction} pill>Start New Goal</PrimaryButton>;
    const content = <div className={styles.modalContent}>{summary}{btn}</div>;
    return <StandardModal title={title} onClose={onAction} size="sm" modalClassName={styles.modalContent}>{content}</StandardModal>;
};

export const BreakModal = ({ onAction }) => {
    const msg = <div className={styles.modalMessage}>Great job! Time to take a well-deserved break.</div>;
    const btn = <PrimaryButton className={`${styles.button} ${styles.primary}`} onClick={onAction} pill>Start Break</PrimaryButton>;
    const content = <div className={styles.modalContent}>{msg}{btn}</div>;
    return <StandardModal title="Focus session complete" onClose={onAction} size="sm" modalClassName={styles.modalContent}>{content}</StandardModal>;
};

export const LeaveTimerModal = ({ onCancel, onPause, onExit }) => {
    const msg = <div className={`${styles.modalMessage} ${styles.leaveModalMessage}`}>Your timer is still running.</div>;
    const pBtn = <PrimaryButton className={`${styles.button} ${styles.primary}`} onClick={onPause} pill>Pause Timer</PrimaryButton>;
    const eBtn = <PrimaryButton className={`${styles.button} ${styles.leaveBtnExit}`} variant="secondary" onClick={onExit} pill>Exit</PrimaryButton>;
    const cBtn = <PrimaryButton className={`${styles.button} ${styles.leaveBtnCancel}`} variant="ghost" onClick={onCancel} pill>Cancel</PrimaryButton>;
    const btns = <div className={styles.leaveModalButtons}>{pBtn}{eBtn}{cBtn}</div>;
    const content = <div className={styles.modalContent}>{msg}{btns}</div>;
    return <StandardModal title="Leave focus time?" onClose={onCancel} size="sm" modalClassName={styles.modalContent}>{content}</StandardModal>;
};

export const EndEarlyModal = ({ onConfirm, onCancel }) => {
    const msg = <div className={`${styles.modalMessage} ${styles.leaveModalMessage}`}>If you end session early it won't count as a completed session.</div>;
    const cBtn = <PrimaryButton className={`${styles.button} ${styles.leaveBtnCancel}`} variant="ghost" onClick={onCancel} pill>Cancel</PrimaryButton>;
    const eBtn = <PrimaryButton className={`${styles.button} ${styles.danger}`} variant="danger" onClick={onConfirm} pill>End Session</PrimaryButton>;
    const btns = <div className={styles.leaveModalButtons}>{cBtn}{eBtn}</div>;
    const content = <div className={styles.modalContent}>{msg}{btns}</div>;
    return <StandardModal title="End session early?" onClose={onCancel} size="sm" modalClassName={styles.modalContent}>{content}</StandardModal>;
};
