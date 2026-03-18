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

const ACTIVE_BREAK_OPTIONS = [
    { id: 'stretch', label: '5m Stretch', hint: 'Do a quick mobility reset.' },
    { id: 'hydrate', label: 'Hydrate', hint: 'Refill water before next focus block.' },
    { id: 'walk', label: 'Campus Walk', hint: 'Walk briefly and come back refreshed.' },
];

const LEAVE_SESSION_NUDGES = [
    'Strand campus is still bustling. Give this block 10 more minutes.',
    'Even the Maughan library guards do not give up this early.',
    'You are already in motion. A short break beats a full quit.',
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

export const BreakStartedPopup = ({ time, onAction }) => (
    <StandardModal title="Break started" subtitle="Use this moment to reset." onClose={onAction} size="sm" centerText>
        <div className={styles.autoBreakContent}>
            <div className={styles.autoBreakLabel}>Next focus session in</div>
            <div className={styles.autoBreakTime}>{formatTime(time)}</div>
            <p className={styles.autoBreakText}>A 5-minute micro-break gives your brain a clean reset.</p>
            <PrimaryButton
                className={`${styles.button} ${styles.primary}`}
                onClick={onAction}
                pill
            >
                Skip Break
            </PrimaryButton>
        </div>
    </StandardModal>
);

export const SummaryPill = ({ label, value, type }) => {
    const lbl = <span className={styles.summaryLabel}>{label}</span>;
    const val = <span className={`${styles.summaryPill} ${styles[`pill${type}`]}`}>{value}</span>;
    return <div className={styles.summaryItem}>{lbl}{val}</div>;
};

const GoalSummary = ({ sessions, workTime, breakTime, distractionCount }) => {
    const title = <p className={styles.goalReachedSummaryText}>You've completed all your scheduled sessions. Amazing work!</p>;
    const distractionText = <p className={styles.goalReachedSummaryText}>
        {distractionCount > 0
            ? `You stayed focused, but had ${distractionCount} interruption${distractionCount > 1 ? 's' : ''}.`
            : 'Clean focus run — no interruptions tracked.'}
    </p>;
    const sPill = <SummaryPill label="✅ Sessions" value={sessions} type="Sessions" />;
    const fPill = <SummaryPill label="🔥 Focus" value={formatTime(workTime)} type="Focus" />;
    const bPill = <SummaryPill label="☕ Break" value={formatTime(breakTime)} type="Break" />;
    const container = <div className={styles.goalReachedStats}>{sPill}{fPill}{bPill}</div>;
    return <div className={styles.goalReachedSummary}>{title}{distractionText}{container}</div>;
};

const MOODS = [
    { key: 'hard', emoji: '😤', label: 'Hard' },
    { key: 'good', emoji: '😊', label: 'Good' },
    { key: 'locked_in', emoji: '🔥', label: 'Locked in' },
];

export const GoalModal = ({ sessions, workTime, breakTime, onAction, distractionCount = 0 }) => {
    const [mood, setMood] = useState(null);

    const handleComplete = () => {
        if (mood) try { sessionStorage.setItem('lastSessionMood', mood); } catch { }
        onAction();
    };

    const title = "Goal reached";
    const summary = <GoalSummary sessions={sessions} workTime={workTime} breakTime={breakTime} distractionCount={distractionCount} />;
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
    return (
        <StandardModal
            title={title}
            onClose={handleComplete}
            size="sm"
            backdropClassName={styles.endSessionBackdrop}
            modalClassName={styles.goalReachedModal}
            contentClassName={styles.goalReachedContent}
        >
            <div className={styles.goalReachedBody}>
                <div className={styles.goalReachedRecapLabel}>Session recap</div>
                {summary}
                {moodPicker}
                <PrimaryButton className={styles.goalReachedButton} variant="primary" onClick={handleComplete} pill>
                    Start New Goal
                </PrimaryButton>
            </div>
        </StandardModal>
    );
};

export const BreakModal = ({ onAction }) => {
    const tip = useMemo(() => BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)], []);
    const [selected, setSelected] = useState(ACTIVE_BREAK_OPTIONS[0].id);
    const selectedLabel = ACTIVE_BREAK_OPTIONS.find((option) => option.id === selected)?.label || 'Break';
    const msg = <div className={styles.modalMessage}>Great job! Time to take a well-deserved break.</div>;
    const suggestion = <div className={styles.breakSuggestion}>💡 {tip}</div>;
    const breakOptions = (
        <div className={styles.activeBreakGrid}>
            {ACTIVE_BREAK_OPTIONS.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    className={`${styles.activeBreakBtn} ${selected === option.id ? styles.activeBreakBtnSelected : ''}`}
                    onClick={() => setSelected(option.id)}
                >
                    <span className={styles.activeBreakLabel}>{option.label}</span>
                    <span className={styles.activeBreakHint}>{option.hint}</span>
                </button>
            ))}
        </div>
    );
    const btn = <PrimaryButton className={`${styles.button} ${styles.primary}`} onClick={onAction} pill>Start {selectedLabel}</PrimaryButton>;
    const content = <div className={styles.modalContent}>{msg}{suggestion}{breakOptions}{btn}</div>;
    return <StandardModal title="Focus session complete" onClose={onAction} size="sm" modalClassName={styles.modalContent}>{content}</StandardModal>;
};

export const LeaveTimerModal = ({
    onCancel,
    onPause,
    onExit,
    onTakeBreak,
    timeLeftSeconds = 0,
    sessionTotalSeconds = 0,
}) => {
    const safeTotal = Math.max(1, Number(sessionTotalSeconds || 0));
    const safeLeft = Math.max(0, Number(timeLeftSeconds || 0));
    const minutesLeft = Math.max(1, Math.ceil(safeLeft / 60));
    const progressPct = Math.max(0, Math.min(100, Math.round(((safeTotal - safeLeft) / safeTotal) * 100)));
    const minutesLabel = `${minutesLeft} min${minutesLeft === 1 ? '' : 's'}`;
    const encouragement = useMemo(
        () => LEAVE_SESSION_NUDGES[Math.floor(Math.random() * LEAVE_SESSION_NUDGES.length)],
        []
    );
    const handleTakeBreak = () => {
        if (onTakeBreak) {
            onTakeBreak();
            return;
        }
        onPause?.();
    };

    return (
        <StandardModal
            title="Hold on, you're doing great!"
            subtitle="Are you sure you want to end your focus session early?"
            onClose={onCancel}
            size="sm"
            modalClassName={styles.leaveNudgeModal}
            contentClassName={styles.leaveNudgeModalContent}
        >
            <div className={styles.leaveNudgeBody}>
                <div className={styles.leaveNudgeLoss}>
                    You are <span className={styles.leaveNudgeMinutes}>{minutesLabel}</span> away from finishing this session. If you quit now, this progress will not be added to your daily goal.
                </div>
                <div className={styles.leaveNudgeProgressCard}>
                    <div className={styles.leaveNudgeProgressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct}>
                        <span className={styles.leaveNudgeProgressFill} style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className={styles.leaveNudgeProgressMeta}>
                        <span>{progressPct}% complete</span>
                        <span>{minutesLeft}m left</span>
                    </div>
                </div>
                <div className={styles.leaveNudgeReggie}>🦁 {encouragement}</div>
                <div className={styles.leaveNudgeActions}>
                    <PrimaryButton className={styles.leaveNudgeStayBtn} variant="ghost" pill onClick={onCancel}>
                        Keep Focusing
                    </PrimaryButton>
                    <PrimaryButton className={styles.leaveNudgeEndBtn} variant="secondary" pill onClick={onExit}>
                        Yes, end session
                    </PrimaryButton>
                </div>
                <PrimaryButton className={styles.leaveNudgeBreakBtn} variant="primary" pill onClick={handleTakeBreak}>
                    Take a 5m Break instead
                </PrimaryButton>
            </div>
        </StandardModal>
    );
};

export const EndEarlyModal = ({ onConfirm, onCancel, elapsedSeconds = 0, goalSeconds = 0 }) => {
    const safeGoal = Math.max(60, Number(goalSeconds || 0));
    const safeElapsed = Math.max(0, Math.min(safeGoal, Number(elapsedSeconds || 0)));
    const minutesDone = Math.max(0, Math.floor(safeElapsed / 60));
    const minutesGoal = Math.max(1, Math.round(safeGoal / 60));
    const minutesLeft = Math.max(0, Math.ceil((safeGoal - safeElapsed) / 60));
    const progressPct = Math.max(0, Math.min(100, Math.round((safeElapsed / safeGoal) * 100)));
    const minutesDoneLabel = `${minutesDone} minute${minutesDone === 1 ? '' : 's'}`;
    const minutesGoalLabel = `${minutesGoal}-minute`;

    return (
        <StandardModal
            onClose={onCancel}
            size="sm"
            hideHeader
            backdropClassName={styles.endSessionBackdrop}
            modalClassName={styles.endSessionModal}
            contentClassName={styles.endSessionContent}
        >
            <div className={styles.endSessionBody}>
                <div className={styles.endSessionHead}>
                    <h2 className={styles.endSessionTitle}>Finish session now?</h2>
                    <button
                        type="button"
                        className={styles.endSessionCloseBtn}
                        onClick={onCancel}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                <div className={styles.endSessionRecapLabel}>Session recap</div>
                <p className={styles.endSessionRecapText}>
                    You&apos;ve focused for <span className={styles.endSessionHighlight}>{minutesDoneLabel}</span>.{' '}
                    {minutesLeft > 0
                        ? <>You&apos;re so close to your <span className={styles.endSessionHighlight}>{minutesGoalLabel}</span> goal.</>
                        : <>You&apos;ve already reached your <span className={styles.endSessionHighlight}>{minutesGoalLabel}</span> target.</>}
                </p>
                <div className={styles.endSessionProgressCard}>
                    <div className={styles.endSessionProgressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct}>
                        <span className={styles.endSessionProgressFill} style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className={styles.endSessionProgressMeta}>
                        <span>{progressPct}% complete</span>
                        <span>{minutesLeft}m left</span>
                    </div>
                </div>
                <div className={styles.endSessionActions}>
                    <PrimaryButton className={styles.endSessionKeepBtn} variant="primary" pill onClick={onCancel}>
                        Keep Going
                    </PrimaryButton>
                    <PrimaryButton className={styles.endSessionQuitBtn} variant="ghost" pill onClick={onConfirm}>
                        Yes, I&apos;m done for now
                    </PrimaryButton>
                </div>
            </div>
        </StandardModal>
    );
};
