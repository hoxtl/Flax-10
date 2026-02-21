import { useState } from 'react';
import { isEnrolledIn } from './utils/moduleUtils.js';
import { formatWeekdayTime, formatDuration, getDepartment } from './utils/moduleUtils.js';
import styles from './ModulesCard.module.css';

export default function ModulesCard({ module, enrollments, isTeacher, onViewModule, onEnrollmentToggle, onEdit, onDelete, onManageDeadlines }) {
    const enrolled = isEnrolledIn(module.id, enrollments);
    const stop = (e, fn) => { e.stopPropagation(); fn(module); };
    return (
        <article className={GetCardClass(enrolled, isTeacher)} onClick={() => !isTeacher && onViewModule(module)}>
            <CardBody module={module} enrolled={enrolled} isTeacher={isTeacher}
                onEdit={(e) => stop(e, onEdit)}
                onDelete={(e) => stop(e, onDelete)}
                onToggle={(e) => stop(e, onEnrollmentToggle)}
                onManageDeadlines={(e) => stop(e, onManageDeadlines)} />
        </article>
    );
}

function CardBody({ module, enrolled, isTeacher, onEdit, onDelete, onToggle, onManageDeadlines }) {
    return (
        <div className={styles.content}>
            {isTeacher ? <CardHeader module={module}  /> : <CardHeader module={module} enrolled={enrolled} />}
            <h3 className={styles.moduleTitle}>{module.module_name}</h3>
            {module.description && <Description text={module.description} />}
            <ScheduleMeta module={module} />
            <CardActions isTeacher={isTeacher} enrolled={enrolled}
                onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} onManageDeadlines={onManageDeadlines} />
        </div>
    );
}

function GetCardClass(enrolled, is_teacher) {
    let cls = styles.card;
    if (enrolled) cls += ` ${styles.enrolled}`;
    if (!is_teacher) cls += ` ${styles.clickable}`;
    return cls;
}

function CardHeader({ module, enrolled }) {
    return (
        <div className={styles.cardHeader}>
            <div className={styles.iconWrap}>📚</div>
            <div>
                <span className={styles.moduleCode}>{module.module_code}</span>
                <div className={styles.department}>{getDepartment(module.module_code)}</div>
            </div>
            {enrolled && <span className={styles.enrolledBadge}>✓ Enrolled</span>}
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
            {is_long && <button className={styles.expandButton} onClick={(e) => { e.stopPropagation(); setIsExpanded(!is_expanded); }}>{is_expanded ? 'Show less' : 'Read more'}</button>}
        </div>
    );
}

function ScheduleMeta({ module }) {
    return (
        <div className={styles.meta}>
            <MetaItem icon="🕒" text={formatWeekdayTime(module.start_time)} />
            {module.start_time && module.end_time && <MetaItem icon="⏱️" text={formatDuration(module.start_time, module.end_time)} />}
            {module.location && <MetaItem icon="📍" text={module.location} />}
        </div>
    );
}

function MetaItem({ icon, text }) {
    return <span className={styles.metaItem}>{icon} {text}</span>;
}

<<<<<<< HEAD
function CardActions({ isTeacher, enrolled, onEdit, onDelete, onToggle, onManageDeadlines }) {
=======
function CardActions({ isTeacher, enrolled, onEdit, onDelete, onToggle }) {
>>>>>>> origin/main
    return (
        <div className={styles.actions}>
            {isTeacher
                ? <TeacherActions onEdit={onEdit} onDelete={onDelete} onManageDeadlines={onManageDeadlines} />
                : <StudentAction enrolled={enrolled} onToggle={onToggle} />}
        </div>
    );
}

<<<<<<< HEAD
function TeacherActions({ onEdit, onDelete, onManageDeadlines }) {
=======
function TeacherActions({ onEdit, onDelete }) {
>>>>>>> origin/main
    return (
        <>
            <button className={styles.deadlineButton} onClick={onManageDeadlines}>📋 Deadlines</button>
            <button className={styles.editButton} onClick={onEdit}>✎ Edit</button>
            <button className={styles.deleteButton} onClick={onDelete}>× Delete</button>
        </>
    );
}

function StudentAction({ enrolled, onToggle }) {
    return <button className={enrolled ? styles.unenrollButton : styles.enrollButton} onClick={onToggle}>{enrolled ? '× Leave Module' : '+ Enroll'}</button>;
}