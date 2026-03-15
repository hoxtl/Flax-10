import { useState } from 'react';
import { isEnrolledIn } from './utils/moduleUtils.js';
import { formatWeekdayTime, formatDuration, getDepartment } from './utils/moduleUtils.js';
import GridCard from '../common/Card/GridCard';
import styles from './ModulesCard.module.css';

function getCardClass(enrolled, is_teacher) {
    let cls = styles.card;
    if (enrolled) cls += ` ${styles.enrolled}`;
    if (!is_teacher) cls += ` ${styles.clickable}`;
    return cls;
}

export default function ModulesCard({ module, enrollments, isTeacher, onViewModule, onEnrollmentToggle, onEdit, onDelete, onManageDeadlines }) {
    const enrolled = isEnrolledIn(module.id, enrollments);
    const enrollment = enrollments?.find(e => e.module === module.id);
    const isCore = enrollment?.is_core || false;
    const stop = (e, fn) => { e.stopPropagation(); fn(module); };
    return (
        <GridCard className={getCardClass(enrolled, isTeacher)} onClick={() => !isTeacher && onViewModule(module)}>
            <CardBody module={module} enrolled={enrolled} isCore={isCore} isTeacher={isTeacher}
                onEdit={(e) => stop(e, onEdit)}
                onDelete={(e) => stop(e, onDelete)}
                onToggle={(e) => stop(e, onEnrollmentToggle)}
                onManageDeadlines={(e) => stop(e, onManageDeadlines)} />
        </GridCard>
    );
}

function CardBody({ module, enrolled, isCore, isTeacher, onEdit, onDelete, onToggle, onManageDeadlines }) {
    return (
        <div className={styles.content}>
            {isTeacher ? <CardHeader module={module} /> : <CardHeader module={module} enrolled={enrolled} isCore={isCore} />}
            <h3 className={styles.moduleTitle}>{module.module_name}</h3>
            {module.description && <Description text={module.description} />}
            <ScheduleMeta module={module} />
            <CardActions isTeacher={isTeacher} enrolled={enrolled} isCore={isCore}
                onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} onManageDeadlines={onManageDeadlines} />
        </div>
    );
}

function CardHeader({ module, enrolled, isCore }) {
    return (
        <div className={styles.cardHeader}>
            <div className={styles.iconWrap}>📚</div>
            <span className={styles.moduleCode}>{module.module_code}</span>
            <span className={styles.department}>{getDepartment(module.module_code, module.department)}</span>
            {enrolled && (
                <span className={styles.enrolledBadge}>
                    {isCore ? '📌 Core' : '✓ Enrolled'}
                </span>
            )}
        </div>
    );
}

function Description({ text }) {
    const [is_expanded, setIsExpanded] = useState(false);
    const is_long = text.length > 180;
    const display = is_expanded || !is_long ? text : text.substring(0, 180) + '...';
    return (
        <div className={styles.descriptionSection}>
            <p className={styles.description}>{display}</p>
            {is_long && (
                <button
                    className={styles.expandButton}
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!is_expanded); }}
                >
                    {is_expanded ? 'Show less' : 'Read more'}
                </button>
            )}
        </div>
    );
}

function ScheduleMeta({ module }) {
    return (
        <div className={styles.meta}>
            <MetaItem icon="🕒" text={formatWeekdayTime(module.start_time)} />
            {module.start_time && module.end_time && (
                <MetaItem icon="⏱️" text={formatDuration(module.start_time, module.end_time)} />
            )}
            {module.location && <MetaItem icon="📍" text={module.location} />}
        </div>
    );
}

function MetaItem({ icon, text }) {
    return <span className={styles.metaItem}>{icon} {text}</span>;
}

function CardActions({ isTeacher, enrolled, isCore, onEdit, onDelete, onToggle, onManageDeadlines }) {
    return (
        <div className={styles.actions}>
            {isTeacher
                ? <TeacherActions onEdit={onEdit} onDelete={onDelete} onManageDeadlines={onManageDeadlines} />
                : <StudentAction enrolled={enrolled} isCore={isCore} onToggle={onToggle} />}
        </div>
    );
}

function TeacherActions({ onEdit, onDelete, onManageDeadlines }) {
    return (
        <>
            <button className={styles.deadlineButton} onClick={onManageDeadlines}>Assignments</button>
            <button className={styles.editButton} onClick={onEdit}>✎ Edit</button>
            <button className={styles.deleteButton} onClick={onDelete}>× Delete</button>
        </>
    );
}

function StudentAction({ enrolled, isCore, onToggle }) {
    if (enrolled && isCore) {
        return <span className={styles.coreTag}>📌 Core module</span>;
    }
    return (
        <button
            className={enrolled ? styles.unenrollButton : styles.enrollButton}
            onClick={onToggle}
        >
            {enrolled ? '× Leave Module' : '+ Enroll'}
        </button>
    );
}
