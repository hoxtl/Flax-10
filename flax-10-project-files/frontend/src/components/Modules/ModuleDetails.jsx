import { formatTime, formatDuration } from './utils/moduleUtils.js';
import { DEADLINE_LABELS, formatDeadlineDateTime } from './utils/deadlineUtils.js';
import { formatDate } from '../Calendar/utils/dateUtils.js';
import styles from './ModuleDetails.module.css';

// Detail view for a module - includes schedule, description and enrol button
export default function ModuleDetails({ module, is_enrolled, onBack, onEnroll, onUnenroll }) {
    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={onBack}>← Back to all modules</button>
            <div className={styles.content}>
                <DetailsHeader module={module} is_enrolled={is_enrolled} />
                <hr className={styles.divider} />
                <DescriptionSection description={module.description} />
                <hr className={styles.divider} />
                <ScheduleSection module={module} />
                <hr className={styles.divider} />
                <AssignmentsSection deadlines={module.deadlines} />
                <hr className={styles.divider} />
                <ReadingsSectionWrapper readings={module.readings} />
                <EnrollmentAction is_enrolled={is_enrolled} onEnroll={onEnroll} onUnenroll={onUnenroll} />
            </div>
        </div>
    );
}

function DetailsHeader({ module, is_enrolled }) {
    return (
        <div className={styles.headerSection}>
            <div className={styles.titleRow}>
                <span className={styles.moduleCode}>{module.module_code}</span>
                {is_enrolled && <span className={styles.enrolledBadge}>✓ Enrolled</span>}
            </div>
            <h1 className={styles.moduleTitle}>{module.module_name}</h1>
            <div className={styles.moduleLeader}>
                <span className={styles.moduleLeaderLabel}>Module Leader</span>
                <span className={styles.moduleLeaderName}>{module.created_by_name || 'Unknown'}</span>
                {module.created_by_email && (
                    <a href={`mailto:${module.created_by_email}`} className={styles.moduleLeaderEmail}>
                        {module.created_by_email}
                    </a>
                )}
            </div>
        </div>
    );
}

function AssignmentsSection({ deadlines }) {
    return (
        <div className={styles.descriptionSection}>
            <h1 className={styles.sectionTitle}>Assignments</h1>
            <DeadlinesSection deadlines={deadlines} />
        </div>
    );
}

function ReadingsSectionWrapper({ readings }) {
    return (
        <div className={styles.descriptionSection}>
            <h1 className={styles.sectionTitle}>Readings</h1>
            <ReadingsSection readings={readings} />
        </div>
    );
}

function ScheduleSection({ module }) {
    return (
        <div className={styles.scheduleSection}>
            <h1 className={styles.sectionTitle}>Schedule </h1>
            <div className={styles.scheduleGrid}>
                <InfoCard icon="🕒" label="Lecture Time" value={`${formatTime(module.start_time)} – ${formatTime(module.end_time)}`} />
                <InfoCard icon="⏱️" label="Duration" value={formatDuration(module.start_time, module.end_time) || 'TBA'} />
                <InfoCard icon="📍" label="Location" value={module.location || 'To be announced'} />
            </div>
            {module.recurrence_rule && <RecurringBadge />}
        </div>
    );
}
function InfoCard({ icon, label, value }) {
    return (
        <div className={styles.infoCard}>
            <div className={styles.infoIcon}>{icon}</div>
            <div>
                <div className={styles.infoLabel}>{label}</div>
                <div className={styles.infoValue}>{value}</div>
            </div>
        </div>);
}
function RecurringBadge() {
    return (
        <div className={styles.recurringBadge}>
            <span>🔄</span>
            <span>This lecture repeats weekly at the same time</span>
        </div>
    );
}
function DescriptionSection({ description }) {
    return (
        <div className={styles.descriptionSection}>
            <h1 className={styles.sectionTitle}> Description </h1>
            <p className={styles.descriptionText}>{description || 'No description provided.'}</p>
        </div>
    );
}
function EnrollmentAction({ is_enrolled, onEnroll, onUnenroll }) {
    return is_enrolled
        ? <button className={styles.unenrollButton} onClick={onUnenroll}>Leave Module</button>
        : <button className={styles.enrollButton} onClick={onEnroll}>Enroll in Module</button>;
}

function DeadlinesSection({ deadlines }) {
    if (!deadlines?.length) return <p className={styles.descriptionText}>No deadlines assigned yet.</p>;
    const sorted = [...deadlines].sort((a, b) => new Date(a.start_due_date) - new Date(b.start_due_date));
    return (
        <div className={styles.deadlinesList}>
            {sorted.map((d, i) => (
                <div key={d.id} className={styles.deadlineItem}>
                    <span className={styles.deadlineIndex}>{i + 1}</span>
                    <div className={styles.deadlineBody}>
                        <div className={styles.deadlineTitleRow}>
                            <span className={styles.deadlinesType}>{DEADLINE_LABELS[d.deadline_type]}</span>
                            <span className={styles.deadlineTitle}>{d.title}</span>
                        </div>
                        <span className={styles.deadlineDate}>{formatDeadlineDateTime(d.start_due_date)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ReadingsSection({ readings }) {
    if (!readings?.length) return <p className={styles.descriptionText}>No readings assigned yet.</p>;
    const sorted = [...readings].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    return (
        <div className={styles.deadlinesList}>
            {sorted.map((r, i) => 
                <ReadingRow key={r.id} reading={r} index={i} />)}
        </div>
    );
}

function ReadingRow({ reading, index }) {
     return (
        <div className={styles.deadlineItem}>
            <span className={styles.deadlineIndex}>{index + 1}</span>
            <div className={styles.deadlineBody}>
                <div className={styles.deadlineTitleRow}>
                    <span className={styles.deadlinesType}>📖 Reading</span>
                    <span className={styles.deadlineTitle}>{reading.title}</span>
                </div>
                <span className={styles.deadlineDate}> 
                    pages : {reading.start_page}-{reading.end_page} · Due {formatDate(new Date(reading.deadline))}
                </span>
            </div>
        </div>
    );
}
