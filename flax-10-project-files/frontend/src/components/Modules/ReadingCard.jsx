import styles from './DeadlineCard.module.css';
import {formatDate} from '../Calendar/utils/dateUtils';

function ReadingCardHeader({ reading }) {
    return (
        <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
                <span className={styles.typeBadge}>📖 Reading</span>
                <span className={styles.cardTitle}>{reading.title}</span>

            </div>
            <span className={styles.countdown}>Due {formatDate(new Date(reading.deadline))} </span>
        </div>
    );
}

function ReadingCardBody({ reading }) {
    return (
        <>
        {reading.chapter && <p className={styles.data}>{reading.chapter}</p>}
        <p className={styles.meta}>📄 pp {reading.start_page}-{reading.end_page} · {reading.page_count} pages</p> 
        <p className={styles.meta}>⏱️ {reading.duration_minutes} mins estimated</p> 
        </>
    );
}

function ReadingCardActions({ onEdit, onDelete}) {
    return (
        <div className={styles.cardActions}>
            <button className={styles.editButton} onClick={onEdit}>Edit</button>
            <button className={styles.deleteButton} onClick={onDelete}>Delete</button>
        </div>
    ); 
}

export default function ReadingCard({ reading, isTeacher, onEdit, onDelete}) {
    return (
        <div className={styles.card}>
            <ReadingCardHeader reading={reading}/>
            <ReadingCardBody reading={reading}/>
            {isTeacher && <ReadingCardActions onEdit={onEdit} onDelete={onDelete}/>}
        </div>
    );
}