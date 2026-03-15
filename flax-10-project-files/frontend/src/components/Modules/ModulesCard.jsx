import { isEnrolledIn } from './utils/moduleUtils.js';
import { formatDuration, formatTime, getDepartment } from './utils/moduleUtils.js';
import GridCard from '../common/Card/GridCard';
import styles from './ModulesCard.module.css';

const DEPARTMENT_ACCENTS = {
    "Natural, Mathematical & Engineering Sciences": "var(--study)",
    "Life Sciences & Medicine": "var(--health)",
    "Law": "var(--kcl-accent)",
    "Psychiatry, Psychology & Neuroscience": "var(--personal)",
    "Business": "var(--primary)",
    "Arts & Humanities": "var(--flax-gold)",
    "Social Science & Public Policy": "var(--c-caramel)",
    "Nursing, Midwifery & Palliative Care": "var(--sage)",
    "Dentistry, Oral & Craniofacial Sciences": "var(--danger)",
};

const DEPARTMENT_SHORT_NAMES = {
    "Natural, Mathematical & Engineering Sciences": "Natural, Mathematical & Engineering Sciences",
    "Life Sciences & Medicine": "Life Sciences & Medicine",
    "Law": "Law",
    "Psychiatry, Psychology & Neuroscience": "Psychiatry, Psychology & Neuroscience",
    "Business": "Business",
    "Arts & Humanities": "Arts & Humanities",
    "Social Science & Public Policy": "Social Science & Public Policy",
    "Nursing, Midwifery & Palliative Care": "Nursing, Midwifery & Palliative Care",
    "Dentistry, Oral & Craniofacial Sciences": "Dentistry, Oral & Craniofacial Sciences",
};

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
    const department = getDepartment(module.module_code, module.department);
    const accent = DEPARTMENT_ACCENTS[department] || "var(--primary)";
    const stop = (e, fn) => { e.stopPropagation(); fn(module); };
    return (
        <GridCard
            className={getCardClass(enrolled, isTeacher)}
            style={{ "--module-accent": accent }}
            onClick={() => !isTeacher && onViewModule(module)}
        >
            <CardBody module={module} enrolled={enrolled} isCore={isCore} isTeacher={isTeacher}
                onView={(e) => stop(e, onViewModule)}
                onEdit={(e) => stop(e, onEdit)}
                onDelete={(e) => stop(e, onDelete)}
                onToggle={(e) => stop(e, onEnrollmentToggle)}
                onManageDeadlines={(e) => stop(e, onManageDeadlines)} />
        </GridCard>
    );
}

function CardBody({ module, enrolled, isCore, isTeacher, onView, onEdit, onDelete, onToggle, onManageDeadlines }) {
    return (
        <div className={styles.content}>
            {isTeacher ? <CardHeader module={module} /> : <CardHeader module={module} enrolled={enrolled} isCore={isCore} />}
            <h3 className={styles.moduleTitle}>{module.module_name}</h3>
            {module.description && <Description text={module.description} />}
            <QuickMeta module={module} />
            <CardActions isTeacher={isTeacher} enrolled={enrolled} isCore={isCore}
                onView={onView} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} onManageDeadlines={onManageDeadlines} />
        </div>
    );
}

function CardHeader({ module, enrolled, isCore }) {
    const department = getDepartment(module.module_code, module.department);
    return (
        <div className={styles.cardHeader}>
            <div className={styles.headerTopRow}>
                <div className={styles.headerIdentity}>
                    <div className={styles.iconWrap}>📚</div>
                    <span className={styles.moduleCode}>{module.module_code}</span>
                </div>
                {enrolled && (
                    <span className={styles.enrolledBadge}>
                        {isCore ? '📌 Core' : '✓ Enrolled'}
                    </span>
                )}
            </div>
            <span className={styles.departmentText}>{DEPARTMENT_SHORT_NAMES[department] || department}</span>
        </div>
    );
}

function Description({ text }) {
    return <p className={styles.description}>{text}</p>;
}

function getScheduleBits(start_time) {
    if (!start_time) return { day: "TBA", time: "TBA" };
    const date = new Date(start_time);
    const day = date.toLocaleDateString("en-GB", { weekday: "short" });
    const time = formatTime(start_time);
    return { day, time };
}

function QuickMeta({ module }) {
    const { day, time } = getScheduleBits(module.start_time);
    const duration = module.start_time && module.end_time ? formatDuration(module.start_time, module.end_time) : "TBA";
    const deadlinesCount = module.deadlines?.length || 0;
    return (
        <div className={styles.metaPills}>
            <MetaPill icon="📅" text={`${day} ${time}`} />
            <MetaPill icon="⏱️" text={duration} />
            <MetaPill icon="🗂️" text={`${deadlinesCount} due`} />
        </div>
    );
}

function MetaPill({ icon, text }) {
    return <span className={styles.metaPill}>{icon} {text}</span>;
}

function CardActions({ isTeacher, enrolled, isCore, onView, onEdit, onDelete, onToggle, onManageDeadlines }) {
    return (
        <div className={styles.actions}>
            {isTeacher
                ? <TeacherActions onEdit={onEdit} onDelete={onDelete} onManageDeadlines={onManageDeadlines} />
                : <StudentActions enrolled={enrolled} isCore={isCore} onToggle={onToggle} onView={onView} />}
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

function StudentActions({ enrolled, isCore, onToggle, onView }) {
    return (
        <>
            <button type="button" className={styles.viewDetailsBtn} onClick={onView}>View details</button>
            <StudentAction enrolled={enrolled} isCore={isCore} onToggle={onToggle} />
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
