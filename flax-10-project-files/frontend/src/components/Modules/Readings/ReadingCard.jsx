/*
 * Reading card displaying page range, estimated duration, and teacher actions.
 */

import { useState } from 'react';
import styles from '../Deadlines/DeadlineCard.module.css';
import {formatDate} from '../../Calendar/utils/dateUtils';
import { ModuleItemCardActions, ModuleItemDeleteDialog } from '../shared/moduleCardActions';

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

export default function ReadingCard({ reading, isTeacher, onEdit, onDelete}) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    return (
        <div className={styles.card}>
            <ReadingCardHeader reading={reading}/>
            <ReadingCardBody reading={reading}/>
            {isTeacher && <ModuleItemCardActions onEdit={onEdit} onDelete={() => setShowDeleteConfirm(true)} styles={styles} />}
            {showDeleteConfirm && (
                <ModuleItemDeleteDialog itemType="Reading" itemTitle={reading.title} onConfirm={() => { onDelete(); setShowDeleteConfirm(false); }} onCancel={() => setShowDeleteConfirm(false)} />
            )}
        </div>
    );
}
