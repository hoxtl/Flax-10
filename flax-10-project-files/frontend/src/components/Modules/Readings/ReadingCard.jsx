/*
 * Reading card displaying page range, estimated duration, and teacher actions.
 */
<<<<<<< HEAD

import { useState } from 'react';
import styles from '../deadlines/DeadlineCard.module.css';
import {formatDate} from '../../calendar/utils/dateUtils';
import { ModuleItemCardActions, ModuleItemDeleteDialog } from '../shared/moduleCardActions';
=======
import { useState } from 'react';
import styles from '../Deadlines/DeadlineCard.module.css';
import {formatDate} from '../../Calendar/utils/dateUtils';
import ConfirmModal from '../../common/ConfirmModal/ConfirmModal';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

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

<<<<<<< HEAD
=======
function ReadingCardActions({ onEdit, onDelete}) {
    return (
        <div className={styles.cardActions}>
            <button className={styles.editButton} onClick={onEdit}>Edit</button>
            <button className={styles.deleteButton} onClick={onDelete}>Delete</button>
        </div>
    ); 
}

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export default function ReadingCard({ reading, isTeacher, onEdit, onDelete}) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    return (
        <div className={styles.card}>
            <ReadingCardHeader reading={reading}/>
            <ReadingCardBody reading={reading}/>
<<<<<<< HEAD
            {isTeacher && <ModuleItemCardActions onEdit={onEdit} onDelete={() => setShowDeleteConfirm(true)} styles={styles} />}
            {showDeleteConfirm && (
                <ModuleItemDeleteDialog itemType="Reading" itemTitle={reading.title} onConfirm={() => { onDelete(); setShowDeleteConfirm(false); }} onCancel={() => setShowDeleteConfirm(false)} />
            )}
        </div>
    );
}
=======
            {isTeacher && <ReadingCardActions onEdit={onEdit} onDelete={() => setShowDeleteConfirm(true)} />}
            {showDeleteConfirm && (
                <ConfirmModal title="Delete Reading" message={`Are you sure you want to delete "${reading.title}"? This action cannot be undone.`}
                    onConfirm={() => { onDelete(); setShowDeleteConfirm(false); }} onCancel={() => setShowDeleteConfirm(false)}
                    confirmText="Delete" isDanger={true} />
            )}
        </div>
    );
}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
