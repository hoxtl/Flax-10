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

const MOODS = [
    { key: 'hard', emoji: '😤', label: 'Hard' },
    { key: 'good', emoji: '😊', label: 'Good' },
    { key: 'locked_in', emoji: '🔥', label: 'Locked in' },
];

export const GoalModal = ({ sessions, workTime, breakTime, onAction }) => {
    const [mood, setMood] = useState(null);

    const handleComplete = () => {
        if (mood) try { sessionStorage.setItem('lastSessionMood', mood); } catch {}
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
