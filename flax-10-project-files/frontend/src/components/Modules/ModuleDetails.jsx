import { formatDuration, formatTime, getDepartment, getCourse } from './utils/moduleUtils.js';
import { DEADLINE_LABELS, formatDeadlineDateTime } from './utils/deadlineUtils.js';
import { formatDate } from '../Calendar/utils/dateUtils.js';
import EntityLinkChip from '../common/EntityLinkChip/EntityLinkChip.jsx';
import { getTutorPhotoFallback } from '../../utils/tutorPhotoFallback.js';
import styles from './ModuleDetails.module.css';

function getSortedDeadlines(deadlines = []) {
    return [...deadlines].sort((a, b) => new Date(a.start_due_date) - new Date(b.start_due_date));
}

function getNextDeadline(deadlines = []) {
    const now = new Date();
    const sorted = getSortedDeadlines(deadlines);
    return sorted.find((d) => new Date(d.start_due_date) >= now) || sorted[0] || null;
}

function getUrgencyLabel(dueDate) {
    const now = new Date();
    const diffMs = new Date(dueDate) - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays <= 2) return "due-soon";
    if (diffDays <= 7) return "this-week";
    return "later";
}

function getUrgencyText(kind) {
    if (kind === "due-soon") return "Due soon";
    if (kind === "this-week") return "This week";
    return "Later";
}

function getTimelineProgress(deadlines = []) {
    if (deadlines.length < 2) return null;
    const dates = deadlines.map((d) => new Date(d.start_due_date)).filter((d) => !Number.isNaN(d.getTime()));
    if (dates.length < 2) return null;
    const start = new Date(Math.min(...dates));
    const end = new Date(Math.max(...dates));
    const total = end - start;
    if (total <= 0) return null;
    const now = new Date();
    const raw = ((now - start) / total) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
}

function getNextClassText(startTime, endTime) {
    if (!startTime || !endTime) return "No class time set";
    const date = new Date(startTime);
    const day = date.toLocaleDateString("en-GB", { weekday: "long" });
    return `${day}, ${formatTime(startTime)} - ${formatTime(endTime)}`;
}

function getInitials(name) {
    if (!name) return "TU";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getTutorImage(moduleCode, tutorName) {
    return getTutorPhotoFallback({
        fullName: tutorName,
        seed: moduleCode,
        allowGeneric: true,
    });
}

export default function ModuleDetails({ module, is_enrolled, onBack, onEnroll, onUnenroll }) {
    const department = getDepartment(module.module_code, module.department);
    const course = getCourse(module.module_code, module.course);
    const sortedDeadlines = getSortedDeadlines(module.deadlines);
    const nextDeadline = getNextDeadline(sortedDeadlines);
    const timelineProgress = getTimelineProgress(sortedDeadlines);
    const nextClass = getNextClassText(module.start_time, module.end_time);

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={onBack}>← Back to all modules</button>

            <section className={styles.hero}>
                <div className={styles.heroTop}>
                    <EntityLinkChip to="/modules" className={styles.moduleCode}>{module.module_code}</EntityLinkChip>
                    <span className={styles.departmentChip}>{department}</span>
                    {course && <span className={styles.courseChip}>{course}</span>}
                    {is_enrolled && <span className={styles.enrolledBadge}>✓ Enrolled</span>}
                </div>
                <h1 className={styles.moduleTitle}>{module.module_name}</h1>
                <p className={styles.heroSubtext}>
                    {module.description || "No module summary available yet."}
                </p>

                <div className={styles.heroMeta}>
                    <div className={styles.heroMetaItem}>
                        <span className={styles.heroMetaLabel}>Tutor</span>
                        <div className={styles.tutorInline}>
                            <img
                                className={styles.tutorPhoto}
                                src={getTutorImage(module.module_code, module.created_by_name)}
                                alt={`${module.created_by_name || "Tutor"} profile`}
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback = e.currentTarget.nextElementSibling;
                                    if (fallback) fallback.style.display = "inline-flex";
                                }}
                            />
                            <span className={styles.tutorAvatarFallback}>{getInitials(module.created_by_name || "Tutor")}</span>
                            {module.created_by
                                ? (
                                    <EntityLinkChip to={`/profile/${module.created_by}`} className={styles.heroMetaValue}>
                                        {module.created_by_name || "Unknown"}
                                    </EntityLinkChip>
                                )
                                : <span className={styles.heroMetaValue}>{module.created_by_name || "Unknown"}</span>}
                        </div>
                    </div>
                    <div className={styles.heroMetaItem}>
                        <span className={styles.heroMetaLabel}>Email</span>
                        {module.created_by_email
                            ? <a href={`mailto:${module.created_by_email}`} className={styles.heroLink}>{module.created_by_email}</a>
                            : <span className={styles.heroMetaValue}>Not available</span>}
                    </div>
                </div>

                <div className={styles.heroActions}>
                    {module.created_by_email && (
                        <a href={`mailto:${module.created_by_email}`} className={styles.secondaryAction}>
                            Email tutor
                        </a>
                    )}
                    <EnrollmentAction is_enrolled={is_enrolled} onEnroll={onEnroll} onUnenroll={onUnenroll} />
                </div>
            </section>

            <section className={styles.layout}>
                <div className={styles.mainColumn}>
                    <article className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>Schedule</h2>
                        <div className={styles.scheduleRow}>
                            <ScheduleItem icon="📅" label="Day & time" value={nextClass} />
                            <span className={styles.scheduleDivider} />
                            <ScheduleItem icon="⏱" label="Duration" value={formatDuration(module.start_time, module.end_time) || 'TBA'} />
                            <span className={styles.scheduleDivider} />
                            <ScheduleItem icon="📍" label="Location" value={module.location || 'To be announced'} />
                        </div>
                        {module.recurrence_rule && <RecurringBadge />}
                    </article>

                    <article className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>Assignments</h2>
                        <DeadlinesSection deadlines={sortedDeadlines} moduleCode={module.module_code} />
                    </article>
                    <article className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>Readings</h2>
                        <ReadingsSection readings={module.readings} />
                    </article>
                </div>

                <aside className={styles.sideColumn}>
                    <div className={styles.sideCard}>
                        <p className={styles.sideLabel}>Next class</p>
                        <p className={styles.sideValue}>{nextClass}</p>
                    </div>
                    <div className={styles.sideCard}>
                        <p className={styles.sideLabel}>Next deadline</p>
                        <p className={styles.sideValue}>
                            {nextDeadline ? `${nextDeadline.title} · ${formatDeadlineDateTime(nextDeadline.start_due_date)}` : "No deadlines yet"}
                        </p>
                    </div>
                    <div className={styles.sideCard}>
                        <p className={styles.sideLabel}>Progress</p>
                        <p className={styles.sideValue}>
                            {timelineProgress !== null
                                ? timelineProgress === 0
                                    ? "Assignment timeline hasn't started yet"
                                    : `${timelineProgress}% through assignment timeline`
                                : "Progress will appear when more deadlines are set"}
                        </p>
                        {timelineProgress !== null && (
                            <div className={styles.progressTrack} aria-hidden="true">
                                <div className={styles.progressFill} style={{ width: `${timelineProgress}%` }} />
                            </div>
                        )}
                    </div>
                </aside>
            </section>
        </div>
    );
}

function ScheduleItem({ icon, label, value }) {
    return (
        <div className={styles.scheduleItem}>
            <span className={styles.scheduleIcon}>{icon}</span>
            <div>
                <div className={styles.scheduleLabel}>{label}</div>
                <div className={styles.scheduleValue}>{value}</div>
            </div>
        </div>
    );
}

function RecurringBadge() {
    return (
        <div className={styles.recurringBadge}>
            <span>🔄</span>
            <span>This lecture repeats weekly at the same time</span>
        </div>
    );
}

function EnrollmentAction({ is_enrolled, onEnroll, onUnenroll }) {
    return is_enrolled
        ? <button className={styles.unenrollButton} onClick={onUnenroll}>Leave module</button>
        : <button className={styles.enrollButton} onClick={onEnroll}>Enroll in module</button>;
}

function DeadlinesSection({ deadlines, moduleCode }) {
    if (!deadlines?.length) return <p className={styles.emptyText}>No assignments yet.</p>;

    return (
        <div className={styles.deadlinesList}>
            {deadlines.map((d, i) => {
                const urgency = getUrgencyLabel(d.start_due_date);
                return (
                    <div key={d.id} className={styles.deadlineItem}>
                        <span className={styles.deadlineIndex}>{i + 1}</span>
                        <div className={styles.deadlineBody}>
                            <div className={styles.deadlineTitleRow}>
                                <span className={styles.deadlinesType}>{DEADLINE_LABELS[d.deadline_type]}</span>
                                <EntityLinkChip
                                    to={`/tasks?module=${encodeURIComponent(moduleCode || "")}`}
                                    className={styles.deadlineTitle}
                                    title="Open related tasks"
                                >
                                    {d.title}
                                </EntityLinkChip>
                                <span className={`${styles.urgencyTag} ${styles[urgency]}`}>
                                    {getUrgencyText(urgency)}
                                </span>
                            </div>
                            <span className={styles.deadlineDate}>{formatDeadlineDateTime(d.start_due_date)}</span>
                        </div>
                    </div>
                );
            })}
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
                    {reading.start_page != null && reading.end_page != null
                        ? `pp. ${reading.start_page}–${reading.end_page}`
                        : reading.page_count ? `${reading.page_count} pages` : ''}
                    {' · '}Due {formatDate(new Date(reading.deadline))}
                </span>
            </div>
        </div>
    );
}
