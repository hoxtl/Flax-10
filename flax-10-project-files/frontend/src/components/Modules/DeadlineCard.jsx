import { formatFullDateTime } from './utils/moduleUtils';
import { getDeadlineCountdown, DEADLINE_LABELS } from "./utils/deadlineUtils.js";
import styles from './DeadlineCard.module.css';

export default function DeadlineCard({ deadline, is_teacher, onEdit, onDelete }) {
    const countdown = getDeadlineCountdown(deadline.start_due_date );
    return (
        <div className={`${styles.card} ${countdown === 'Past due' ? styles.past : ''}`}>
            <DeadlineCardHeader deadline={deadline} countdown={countdown} />
            <DeadlineCardBody deadline={deadline} />
            {is_teacher && <DeadlineCardActions onEdit={onEdit} onDelete={onDelete} />}
        </div>
    );
}

function DeadlineCardHeader({ deadline, countdown }) {
    return (
        <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
                <span className={styles.typeBadge}>{DEADLINE_LABELS[deadline.deadline_type]}</span>
                <span className={styles.cardTitle}>{deadline.title}</span>
            </div>
            <span className={styles.countdown}>{countdown}</span>
        </div>
    );
}

function DeadlineCardBody({ deadline }) {
    return (
        <>
            <p className={styles.data}>{formatFullDateTime(deadline.start_due_date)}</p>
            {deadline.location && <p className={styles.meta}>📍 {deadline.location}</p>}
            {deadline.description && <p className={styles.meta}>📝 {deadline.description}</p>}
        </>
    );
}

function DeadlineCardActions({ onEdit, onDelete }) {
    return (
        <div className={styles.cardActions}>
            <button className={styles.editButton} onClick={onEdit}>Edit</button>
            <button className={styles.deleteButton} onClick={onDelete}>Delete</button>
        </div>
    );
}