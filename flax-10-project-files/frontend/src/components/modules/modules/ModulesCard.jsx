/*
 * Module card displaying module info, enrolment status, and actions.
 */

import { isEnrolledIn, formatDuration, formatTime, getDepartment, getCourse, normaliseModuleCode } from '../utils/moduleUtils.js';
import { getInitials } from '../../auth/utils/userUtils.js';
import GridCard from '../../common/card/GridCard';
import PrimaryButton from '../../common/primary_button/PrimaryButton';
import EntityLinkChip from '../../common/entity_link_chip/EntityLinkChip.jsx';
import Tooltip from '../../common/Tooltip/Tooltip';
import { getModuleTutorPhoto, hideBrokenTutorImage } from './moduleTutorUtils';
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

function getCardClass(enrolled, is_teacher) {
    let cls = styles.card;
    if (enrolled) cls += ` ${styles.enrolled}`;
    if (!is_teacher) cls += ` ${styles.clickable}`;
    return cls;
}

function getModuleAssignmentCount(module, taskCountsByModule) {
    const explicitCount = [
        module?.assignments_count,
        module?.assignment_count,
        module?.deadlines_count,
        module?.deadline_count,
        module?.assessments_count,
        module?.assessment_count,
    ].find((value) => Number.isFinite(Number(value)));

    if (Number.isFinite(Number(explicitCount))) return Number(explicitCount);
    if (Array.isArray(module?.deadlines)) return module.deadlines.length;

    return taskCountsByModule[normaliseModuleCode(module?.module_code)] || 0;
}

function resolveClassmatesCount(module) {
    return (
        module?.classmates_count ??
        module?.enrollment_count ??
        module?.enrolled_count ??
        module?.class_size ??
        null
    );
}

function useCardData(module, enrollments, taskCountsByModule) {
    const enrolled = isEnrolledIn(module.id, enrollments);
    const enrollment = enrollments?.find(e => e.module === module.id);
    const department = getDepartment(module.module_code, module.department);
    return {
        enrolled, isCore: enrollment?.is_core || false,
        accent: DEPARTMENT_ACCENTS[department] || "var(--primary)",
        upcomingTasksCount: getModuleAssignmentCount(module, taskCountsByModule),
        classmatesCount: resolveClassmatesCount(module),
    };
}

function buildCardHandlers(module, handlers) {
    const stop = (e, fn) => { e.stopPropagation(); fn(module); };
    return {
        onView: (e) => stop(e, handlers.onViewModule), onEdit: (e) => stop(e, handlers.onEdit),
        onDelete: (e) => stop(e, handlers.onDelete), onToggle: (e) => stop(e, handlers.onEnrollmentToggle),
        onManageDeadlines: (e) => stop(e, handlers.onManageDeadlines), onManageReadings: (e) => stop(e, handlers.onManageReadings),
    };
}

export default function ModulesCard(props) {
    const { module, enrollments, isTeacher, onViewModule, taskCountsByModule = {} } = props;
    const data = useCardData(module, enrollments, taskCountsByModule);
    const handlers = buildCardHandlers(module, props);
    return (
        <GridCard className={getCardClass(data.enrolled, isTeacher)} style={{ "--module-accent": data.accent }}
            onClick={() => !isTeacher && onViewModule(module)}>
            <CardBody module={module} {...data} isTeacher={isTeacher} {...handlers} />
        </GridCard>
    );
}

function CardBody({ module, enrolled, isCore, isTeacher, onView, onEdit, onDelete, onToggle, onManageDeadlines, onManageReadings, upcomingTasksCount, classmatesCount }) {
    const moduleTitle = module.module_code
        ? `${module.module_name} (${module.module_code})`
        : module.module_name;
    return (
        <div className={styles.content}>
            {isTeacher ? <CardHeader module={module} /> : <CardHeader module={module} enrolled={enrolled} isCore={isCore} />}
            <h3 className={styles.moduleTitle}>{moduleTitle}</h3>
            {module.description && <Description text={module.description} />}
            <QuickMetaRow module={module} upcomingTasksCount={upcomingTasksCount} />
            <ClassmatesLink module={module} classmatesCount={classmatesCount} />
            <CardActions isTeacher={isTeacher} enrolled={enrolled} isCore={isCore}
                onView={onView} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} onManageDeadlines={onManageDeadlines}  onManageReadings={onManageReadings}/>
        </div>
    );
}

function TutorAvatar({ module }) {
    const src = getModuleTutorPhoto(module);
    const initials = getInitials(module.created_by_name);
    const tutorName = module.created_by_name || 'Tutor';
    return (
        <div className={styles.tutorAvatar} title={tutorName}>
            {src && <img src={src} alt={tutorName} className={styles.tutorAvatarImg} onError={hideBrokenTutorImage} />}
            <span className={styles.tutorAvatarFallback} style={src ? { display: 'none' } : undefined}>{initials}</span>
        </div>
    );
}

function EnrolledBadge({ enrolled, isCore }) {
    if (!enrolled) return null;
    return <span className={styles.enrolledBadge}>{isCore ? '📌 Core' : '✓ Enrolled'}</span>;
}

function HeaderChips({ course, department }) {
    return (
        <div className={styles.headerChips}>
            {course && <span className={styles.courseText}>{course}</span>}
            <span className={styles.departmentText}>{department}</span>
        </div>
    );
}

function CardHeader({ module, enrolled, isCore }) {
    const department = getDepartment(module.module_code, module.department);
    const course = getCourse(module.module_code, module.course);
    return (
        <div className={styles.cardHeader}>
            {enrolled && <EnrolledBadge enrolled={enrolled} isCore={isCore} />}
            <div className={styles.headerChipsRow}>
                <HeaderChips course={course} department={department} />
                <TutorAvatar module={module} />
            </div>
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

function QuickMetaRow({ module, upcomingTasksCount }) {
    const { day, time } = getScheduleBits(module.start_time);
    const duration = module.start_time && module.end_time ? formatDuration(module.start_time, module.end_time) : "TBA";
    return (
        <div className={styles.metaPills}>
            <MetaPill icon="📅" text={`${day} ${time}`} />
            <MetaPill icon="⏱️" text={duration} />
            {hasValidCount(upcomingTasksCount) && (
                <span className={styles.taskChipInline}>
                    📋 {upcomingTasksCount} assignment{upcomingTasksCount === 1 ? "" : "s"}
                </span>
            )}
        </div>
    );
}

function MetaPill({ icon, text }) {
    return <span className={styles.metaPill}>{icon} {text}</span>;
}

function hasValidCount(count) {
    return Number.isFinite(Number(count)) && Number(count) > 0;
}

function ClassmatesLink({ module, classmatesCount }) {
    if (!hasValidCount(classmatesCount)) return null;
    return (
        <div className={styles.relatedRow}>
            <EntityLinkChip to={`/users?module=${encodeURIComponent(module.module_code || "")}`}
                className={styles.relatedChip} title="Find classmates in this module">
                👥 {classmatesCount} classmate{classmatesCount === 1 ? "" : "s"}
            </EntityLinkChip>
        </div>
    );
}

function CardActions({ isTeacher, enrolled, isCore, onView, onEdit, onDelete, onToggle, onManageDeadlines, onManageReadings }) {
    return (
        <div className={styles.actions}>
            {isTeacher
                ? <TeacherActions onEdit={onEdit} onDelete={onDelete} onManageDeadlines={onManageDeadlines} onManageReadings={onManageReadings}/>
                : <StudentActions enrolled={enrolled} isCore={isCore} onToggle={onToggle} onView={onView} />}
        </div>
    );
}

function TeacherActions({ onEdit, onDelete, onManageDeadlines, onManageReadings }) {
    return (
        <>
            <button className={styles.deadlineButton} onClick={onManageDeadlines}>Assignments</button>
            <button className={styles.deadlineButton} onClick={onManageReadings}>Readings</button>
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

function EnrollButton({ onToggle }) {
    return (
        <PrimaryButton className={styles.enrollPrimaryButton} onClick={onToggle} size="small" pill>
            + Enrol
        </PrimaryButton>
    );
}

function UnenrollButton({ onToggle }) {
    return <button className={styles.unenrollButton} onClick={onToggle}>× Leave Module</button>;
}

function StudentAction({ enrolled, isCore, onToggle }) {
    if (!enrolled) return <EnrollButton onToggle={onToggle} />;
    if (isCore) {
        return (
            <Tooltip content="Cannot leave a core course module" position="top">
                <span className={styles.disabledWrapper}>
                    <button className={`${styles.unenrollButton} ${styles.disabledBtn}`.trim()} disabled aria-disabled="true">
                        × Leave Module
                    </button>
                </span>
            </Tooltip>
        );
    }
    return <UnenrollButton onToggle={onToggle} />;
}
