import styles from "../../pages/Timer/TimerPage.module.css";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import StandardModal from "../common/StandardModal/StandardModal";
import { formatTime } from './TimerComponents';

export const OvertimePopup = ({ mode, time, onAction, isLastSession }) => {
    const title = mode === 'work' ? "Time's Up!" : "Break Over!";
    const subtitle = mode === 'work' ? "You're in overtime mode." : "Time to get back to work.";
    const btnLabel = mode === 'work' ? (isLastSession ? "Finish Goal" : "Start Break") : "Start Work";

    return (
        <StandardModal title={title} subtitle={subtitle} onClose={onAction} size="sm" centerText>
            <div className={styles.overtimeContent}>
                <div className={styles.overtimeTime}>{formatTime(time)}</div>
                <PrimaryButton 
                    className={`${styles.button} ${styles.primary}`} 
                    onClick={onAction} 
                    pill
                >
                    {btnLabel}
                </PrimaryButton>
            </div>
        </StandardModal>
    );
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

import ConfirmModal from "../common/ConfirmModal/ConfirmModal";

export const LeaveTimerModal = ({ onCancel, onPause, onExit }) => {
    return (
        <ConfirmModal
            title="Leave focus time?"
            message="Your timer is still running."
            onConfirm={onPause}
            onCancel={onCancel}
            onAlternate={onExit}
            confirmText="Pause Timer"
            alternateText="Exit"
            cancelText="Cancel"
        />
    );
};

export const EndEarlyModal = ({ onConfirm, onCancel }) => {
    return (
        <ConfirmModal
            title="End session early?"
            message="If you end session early it won't count as a completed session."
            onConfirm={onConfirm}
            onCancel={onCancel}
            confirmText="End Session"
            isDanger={true}
        />
    );
};
