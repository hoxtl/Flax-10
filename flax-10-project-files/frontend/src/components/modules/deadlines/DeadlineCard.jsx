/*
 * Deadline card displaying due date, countdown, and teacher actions.
 */
<<<<<<< HEAD

import { useState } from 'react';
import { formatFullDateTime } from '../utils/moduleUtils';
import { getDeadlineCountdown, DEADLINE_LABELS } from "../utils/deadlineUtils.js";
import { ModuleItemCardActions, ModuleItemDeleteDialog } from '../shared/moduleCardActions';
import LocationLink from '../../common/location_link/LocationLink';
=======
import { useState } from 'react';
import { formatFullDateTime } from '../utils/moduleUtils';
import { getDeadlineCountdown, DEADLINE_LABELS } from "../utils/deadlineUtils.js";
import ConfirmModal from '../../common/ConfirmModal/ConfirmModal';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import styles from './DeadlineCard.module.css';

export default function DeadlineCard({ deadline, is_teacher, onEdit, onDelete }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const countdown = getDeadlineCountdown(deadline.start_due_date);
    return (
        <div className={`${styles.card} ${countdown === 'Past due' ? styles.past : ''}`}>
            <DeadlineCardHeader deadline={deadline} countdown={countdown} />
            <DeadlineCardBody deadline={deadline} />
<<<<<<< HEAD
            {is_teacher && <ModuleItemCardActions onEdit={onEdit} onDelete={() => setShowDeleteConfirm(true)} styles={styles} />}
            {showDeleteConfirm && (
                <ModuleItemDeleteDialog itemType="Deadline" itemTitle={deadline.title} onConfirm={() => { onDelete(); setShowDeleteConfirm(false); }} onCancel={() => setShowDeleteConfirm(false)} />
=======
            {is_teacher && <DeadlineCardActions onEdit={onEdit} onDelete={() => setShowDeleteConfirm(true)} />}
            {showDeleteConfirm && (
                <ConfirmModal title="Delete Deadline" message={`Are you sure you want to delete "${deadline.title}"? This action cannot be undone.`}
                    onConfirm={() => { onDelete(); setShowDeleteConfirm(false); }} onCancel={() => setShowDeleteConfirm(false)}
                    confirmText="Delete" isDanger={true} />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
            )}
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
            {deadline.location && (
                <p className={styles.meta}>
                    <LocationLink location={deadline.location} className={styles.locationLink} />
                </p>
            )}
            {deadline.description && <p className={styles.meta}>📝 {deadline.description}</p>}
        </>
    );
}
