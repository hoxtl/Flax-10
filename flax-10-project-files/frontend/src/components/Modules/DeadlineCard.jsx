import { formatFullDateTime } from "../../utils/moduleUtils";
import { getDeadlineCountdown } from "../../utils/cardUtils";
import styles from '../ModulesCard.module.css';

const DEADLINES = { exam: 'Exam', coursework: 'Coursework', quiz: 'Quiz', presentation: 'Presentation' };

function DeadlineCardHeader({deadline, countdown}) {
    return (
        <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
                <span className={styles.typeBadge}>{DEADLINES[deadline.deadline_type]}</span>
                <span className={styles.cardTitle}>{deadline.title}</span>
            </div>
            <span className={styles.countdown}>{countdown}</span>
        </div>
    );
}

function DeadlineCardBody({ deadline}) {
    return (
        <> 
            <p className={styles.data}> {formatFullDateTime(deadline.start_due_Date)} </p>
            {deadline.location ? <p className={styles.meta}>📍 {deadline.location} </p> :null}
            {deadline.description ? <p className={styles.meta}> 📝{deadline.description} </p> :null}
        </>
    );
}

function DeadlineCardActions({onEdit, onDelete}) {
    return (
        <div className={styles.cardActions}>
            <button className={styles.editButton} onClick={onEdit}> Edit </button>
            <button className={styles.deleteButton} onClick={onDelete}> Delete </button>
        </div>
    );
}

export default function DeadlineCard({deadline, is_teacher, onEdit, onDelete}) {
    const countdown = getDeadlineCountdown({ start_time: deadline.start_due_date});
    return (
        <div className={`${styles.card} ${countdown === 'Past due' ? styles.past : ''}`}>
            <DeadlineCardHeader deadline={deadline} countdown={countdown} />
            <DeadlineCardBody deadline={deadline} />
            {is_teacher ? <DeadlineCardActions onEdit={onEdit} onDelete={onDelete}/> : null}
        </div>
    );
}