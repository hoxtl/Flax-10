import { useMemo, useState } from 'react';
import styles from "../../pages/Timer/TimerPage.module.css";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import StandardModal from "../common/StandardModal/StandardModal";
import { formatTime } from './TimerComponents';

const BREAK_SUGGESTIONS = [
    'Stand up and stretch for 2 minutes',
    'Look at something 20 feet away for 20 seconds',
    'Drink a glass of water',
    'Take 5 deep breaths',
    'Walk to another room and back',
    'Roll your shoulders and neck',
    'Close your eyes and rest for a moment',
    'Do a quick breathing exercise',
];

const OvertimeContent = ({ mode, time, onAction, isLastSession }) => {
    const title = <h3>{mode === 'work' ? "Time's Up!" : "Break Over!"}</h3>;
    const subtitle = <p>{mode === 'work' ? "You're in overtime mode." : "Time to get back to work."}</p>;
    const timeDiv = <div className={styles.overtimeTime}>{formatTime(time)}</div>;
    const btnLabel = mode === 'work' ? (isLastSession ? "Finish Goal" : "Start Break") : "Start Work";
    const btn = <PrimaryButton className={`${styles.button} ${styles.primary}`} onClick={onAction} pill>{btnLabel}</PrimaryButton>;
    return <div className={styles.overtimeContent}>{title}{subtitle}{timeDiv}{btn}</div>;
};

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

const MOODS = [
    { key: 'hard', emoji: '😤', label: 'Hard' },
    { key: 'good', emoji: '😊', label: 'Good' },
    { key: 'locked_in', emoji: '🔥', label: 'Locked in' },
];

export const GoalModal = ({ sessions, workTime, breakTime, onAction }) => {
    const [mood, setMood] = useState(null);

    const handleComplete = () => {
        if (mood) try { sessionStorage.setItem('lastSessionMood', mood); } catch { }
        onAction();
    };

    const title = "Goal reached";
    const summary = <GoalSummary sessions={sessions} workTime={workTime} breakTime={breakTime} />;
    const moodPicker = (
        <div className={styles.moodPickerRow}>
            <span className={styles.moodPickerLabel}>How did that feel?</span>
            <div className={styles.moodOptions}>
                {MOODS.map(m => (
                    <button
                        key={m.key}
                        className={`${styles.moodBtn} ${mood === m.key ? styles.moodBtnActive : ''}`}
                        onClick={() => setMood(m.key)}
                    >
                        <span>{m.emoji}</span>
                        <span className={styles.moodBtnLabel}>{m.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
    const btn = <PrimaryButton className={`${styles.button} ${styles.primary} ${styles.goalButton}`} onClick={handleComplete} pill>Start New Goal</PrimaryButton>;
    const content = <div className={styles.modalContent}>{summary}{moodPicker}{btn}</div>;
    return <StandardModal title={title} onClose={handleComplete} size="sm" modalClassName={styles.modalContent}>{content}</StandardModal>;
};

export const BreakModal = ({ onAction }) => {
    const tip = useMemo(() => BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)], []);
    const msg = <div className={styles.modalMessage}>Great job! Time to take a well-deserved break.</div>;
    const suggestion = <div className={styles.breakSuggestion}>💡 {tip}</div>;
    const btn = <PrimaryButton className={`${styles.button} ${styles.primary}`} onClick={onAction} pill>Start Break</PrimaryButton>;
    const content = <div className={styles.modalContent}>{msg}{suggestion}{btn}</div>;
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
