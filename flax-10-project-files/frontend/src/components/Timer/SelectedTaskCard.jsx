import styles from '../../pages/Timer/TimerPage.module.css';
import { taskDueText } from './utils/timerFormatters';

function estimatedFinishTime(t) {
    const remaining = t.targetSessions - t.completedSessions;
    if (remaining <= 0) return null;
    const sessionSec = t.workTime * 60 + t.breakTime * 60;
    const totalSec = (t.isActive || t.isPaused)
        ? Math.max(t.timeLeft, 0) + (remaining - 1) * sessionSec
        : remaining * sessionSec;
    const at = new Date(Date.now() + totalSec * 1000);
    return at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function SelectedTaskCard({ t }) {
    const title = (t.task || '').trim();
    if (!title) return null;

    const dueText = taskDueText({ due_date: t.activeTaskMeta?.dueDate });
    const moduleCode = t.activeTaskMeta?.moduleCode || 'General';
    const listName = t.activeTaskMeta?.listName || 'Task';
    const sessionsLeft = Math.max(0, Number(t.targetSessions || 0) - Number(t.completedSessions || 0));
    const effort = t.activeTaskMeta?.estimatedWorkMinutes
        ? `${t.activeTaskMeta.estimatedWorkMinutes}m planned`
        : `${t.workTime}m x ${t.targetSessions}`;
    const finishAt = estimatedFinishTime(t);
    const deadlineContribution = dueText?.includes('overdue')
        ? 'This focus block helps reduce overdue pressure.'
        : dueText
            ? `This block contributes toward a deadline in ${dueText.replace(' left', '')}.`
            : null;

    return (
        <div className={styles.selectedTaskCard}>
            <div className={styles.selectedTaskTop}>
                <span className={styles.selectedTaskEyebrow}>Currently Working On</span>
                <span className={styles.selectedTaskModule}>{moduleCode}</span>
            </div>
            <p className={styles.selectedTaskTitle}>{title}</p>
            <div className={styles.selectedTaskMetaRow}>
                <span>{listName}</span>
                <span>{dueText || 'No deadline set'}</span>
                <span>{effort}</span>
                <span>{sessionsLeft} session{sessionsLeft === 1 ? '' : 's'} left</span>
                {finishAt && <span>Done by {finishAt}</span>}
            </div>
            <div className={styles.selectedTaskActions}>
                {deadlineContribution && <span className={styles.selectedTaskContribution}>{deadlineContribution}</span>}
                <a href="/tasks" className={styles.selectedTaskLink}>Open task</a>
            </div>
        </div>
    );
}

export function PaceIndicator({ completedSessions, targetSessions }) {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    const elapsed = Math.max(0, Math.min(1, (h - 8) / 14));
    if (elapsed < 0.1 || targetSessions === 0) return null;
    const expected = Math.round(elapsed * targetSessions);
    const diff = completedSessions - expected;
    const { text, cls } = diff >= 1
        ? { text: '🚀 Ahead of pace', cls: styles.paceAhead }
        : diff >= 0
            ? { text: '✓ On track', cls: styles.paceOnTrack }
            : { text: "Let's catch up - Quick 15m sprint?", cls: styles.paceBehind };
    return <div className={`${styles.paceIndicator} ${cls}`}>{text}</div>;
}
