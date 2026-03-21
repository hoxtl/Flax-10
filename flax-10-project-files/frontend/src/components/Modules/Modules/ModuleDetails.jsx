/*
 * Detailed view of a single module with schedule, deadlines, and readings.
 */
import { formatDuration, formatTime, getDepartment, getCourse } from '../utils/moduleUtils.js';
import { DEADLINE_LABELS, formatDeadlineDateTime } from '../utils/deadlineUtils.js';
import { formatDate } from '../../Calendar/utils/dateUtils.js';
import { getInitials } from '../../Authentication/utils/userUtils.js';
import EntityLinkChip from '../../common/EntityLinkChip/EntityLinkChip.jsx';
import { getResolvedUserPhoto } from '../../../utils/tutorPhotoFallback.js';
import BackButton from '../../common/BackButton/BackButton.jsx';
import styles from './ModuleDetails.module.css';
import heroStyles from '../styles/ModuleHero.module.css';
import scheduleStyles from '../styles/ModuleSchedule.module.css';
import deadlineStyles from '../styles/ModuleDeadlines.module.css';
import TravelTimeIndicator from './TravelTimeIndicator.jsx';

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

function getTutorImage(moduleData) {
    return getResolvedUserPhoto({
        id: moduleData?.created_by,
        name: moduleData?.created_by_name,
        role: 'teacher',
        username: moduleData?.created_by_username,
        profile_photo_url: moduleData?.created_by_profile_photo_url,
        seed: moduleData?.created_by_username || moduleData?.created_by || moduleData?.created_by_name,
    }, { allowGeneric: true });
}

function handleTutorImageError(e) {
    e.currentTarget.style.display = "none";
    const fallback = e.currentTarget.nextElementSibling;
    if (fallback) fallback.style.display = "inline-flex";
}

function TutorPhoto({ photo, name }) {
    if (!photo) return null;
    return <img className={heroStyles.tutorPhoto} src={photo} alt={`${name} profile`} onError={handleTutorImageError} />;
}

function TutorName({ id, name }) {
    if (id) return <EntityLinkChip to={`/profile/${id}`} className={heroStyles.heroMetaValue}>{name || "Unknown"}</EntityLinkChip>;
    return <span className={heroStyles.heroMetaValue}>{name || "Unknown"}</span>;
}

function TutorMetaItem({ module, photo }) {
    return (
        <div className={heroStyles.heroMetaItem}>
            <span className={heroStyles.heroMetaLabel}>Tutor</span>
            <div className={heroStyles.tutorInline}>
                <TutorPhoto photo={photo} name={module.created_by_name || "Tutor"} />
                <span className={heroStyles.tutorAvatarFallback} style={photo ? { display: "none" } : undefined}>{getInitials(module.created_by_name)}</span>
                <TutorName id={module.created_by} name={module.created_by_name} />
            </div>
        </div>
    );
}

function EmailMetaItem({ email }) {
    return (
        <div className={heroStyles.heroMetaItem}>
            <span className={heroStyles.heroMetaLabel}>Email</span>
            {email ? <a href={`mailto:${email}`} className={heroStyles.heroLink}>{email}</a> : <span className={heroStyles.heroMetaValue}>Not available</span>}
        </div>
    );
}

function HeroTop({ module, department, course, is_enrolled }) {
    return (
        <div className={heroStyles.heroTop}>
            <EntityLinkChip to="/modules" className={heroStyles.moduleCode}>{module.module_code}</EntityLinkChip>
            <span className={heroStyles.departmentChip}>{department}</span>
            {course && <span className={heroStyles.courseChip}>{course}</span>}
            {is_enrolled && <span className={heroStyles.enrolledBadge}>✓ Enrolled</span>}
        </div>
    );
}

function HeroSection({ module, department, course, is_enrolled, onEnroll, onUnenroll, tutorPhoto }) {
    return (
        <section className={heroStyles.hero}>
            <HeroTop module={module} department={department} course={course} is_enrolled={is_enrolled} />
            <h1 className={heroStyles.moduleTitle}>{module.module_name}</h1>
            <p className={heroStyles.heroSubtext}>{module.description || "No module summary available yet."}</p>
            <div className={heroStyles.heroMeta}><TutorMetaItem module={module} photo={tutorPhoto} /><EmailMetaItem email={module.created_by_email} /></div>
            <div className={heroStyles.heroActions}>
                {module.created_by_email && <a href={`mailto:${module.created_by_email}`} className={heroStyles.secondaryAction}>Email tutor</a>}
                <EnrollmentAction is_enrolled={is_enrolled} onEnroll={onEnroll} onUnenroll={onUnenroll} />
            </div>
        </section>
    );
}

function ScheduleCard({ module, nextClass }) {
    return (
        <article className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Schedule</h2>
            <div className={scheduleStyles.scheduleRow}>
                <ScheduleItem
                    icon="📅"
                    label="Day, time & location"
                    value={<ScheduleSummary nextClass={nextClass} location={module.location} />}
                    className={scheduleStyles.scheduleItemWide}
                    valueClassName={scheduleStyles.scheduleValueInlineWrap}
                />
                <span className={scheduleStyles.scheduleDivider} />
                <ScheduleItem icon="⏱" label="Duration" value={formatDuration(module.start_time, module.end_time) || 'TBA'} className={scheduleStyles.scheduleItemCompact} />
            </div>
            {module.recurrence_rule && <RecurringBadge />}
            <TravelTimeIndicator duration={travelTime} />
        </article>
    );
}

function getProgressText(progress) {
    if (progress === null) return "Progress will appear when more deadlines are set";
    if (progress === 0) return "Assignment timeline hasn't started yet";
    return `${progress}% through assignment timeline`;
}

function SideColumn({ nextClass, nextDeadline, timelineProgress }) {
    const deadlineText = nextDeadline ? `${nextDeadline.title} · ${formatDeadlineDateTime(nextDeadline.start_due_date)}` : "No deadlines yet";
    return (
        <aside className={styles.sideColumn}>
            <div className={styles.sideCard}><p className={styles.sideLabel}>Next class</p><p className={styles.sideValue}>{nextClass}</p></div>
            <div className={styles.sideCard}><p className={styles.sideLabel}>Next deadline</p><p className={styles.sideValue}>{deadlineText}</p></div>
            <div className={styles.sideCard}>
                <p className={styles.sideLabel}>Progress</p><p className={styles.sideValue}>{getProgressText(timelineProgress)}</p>
                {timelineProgress !== null && <div className={styles.progressTrack} aria-hidden="true"><div className={styles.progressFill} style={{ width: `${timelineProgress}%` }} /></div>}
            </div>
        </aside>
    );
}

function useModuleData(module) {
    const sortedDeadlines = getSortedDeadlines(module.deadlines);
    return {
        department: getDepartment(module.module_code, module.department),
        course: getCourse(module.module_code, module.course),
        sortedDeadlines, nextDeadline: getNextDeadline(sortedDeadlines),
        timelineProgress: getTimelineProgress(sortedDeadlines),
        nextClass: getNextClassText(module.start_time, module.end_time),
    };
}

function MainColumn({ module, sortedDeadlines, nextClass, travelTime }) {
    return (
        <div className={styles.mainColumn}>
            <ScheduleCard module={module} nextClass={nextClass} travelTime={travelTime} />
            <article className={styles.sectionCard}><h2 className={styles.sectionTitle}>Assignments</h2><DeadlinesSection deadlines={sortedDeadlines} moduleCode={module.module_code} /></article>
            <article className={styles.sectionCard}><h2 className={styles.sectionTitle}>Readings</h2><ReadingsSection readings={module.readings} /></article>
        </div>
    );
}

export default function ModuleDetails({ module, is_enrolled, onBack, onEnroll, onUnenroll }) {
    const data = useModuleData(module);
    return (
        <div className={styles.container}>
            <div className={styles.backButtonHeader}><BackButton onClick={onBack} label="Back to All Modules" /></div>
            <HeroSection module={module} department={data.department} course={data.course} is_enrolled={is_enrolled} onEnroll={onEnroll} onUnenroll={onUnenroll} tutorPhoto={getTutorImage(module)} />
            <section className={styles.layout}><MainColumn module={module} sortedDeadlines={data.sortedDeadlines} nextClass={data.nextClass} /><SideColumn nextClass={data.nextClass} nextDeadline={data.nextDeadline} timelineProgress={data.timelineProgress} /></section>
        </div>
    );
}

function ScheduleItem({ icon, label, value, className = "", valueClassName = "" }) {
    return (
        <div className={`${scheduleStyles.scheduleItem} ${className}`.trim()}>
            <span className={scheduleStyles.scheduleIcon}>{icon}</span>
            <div>
                <div className={scheduleStyles.scheduleLabel}>{label}</div>
                <div className={`${scheduleStyles.scheduleValue} ${valueClassName}`.trim()}>{value}</div>
            </div>
        </div>
    );
}

function ScheduleSummary({ nextClass, location }) {
    const resolvedLocation = location || 'To be announced';
    return (
        <span className={scheduleStyles.scheduleValueInline}>
            <span className={scheduleStyles.scheduleInlinePrimary}>{nextClass}</span>
            <span className={scheduleStyles.scheduleValueSeparator} aria-hidden="true">·</span>
            <span className={scheduleStyles.scheduleInlineLocation} title={resolvedLocation}>{resolvedLocation}</span>
        </span>
    );
}

function RecurringBadge() {
    return (
        <div className={scheduleStyles.recurringBadge}>
            <span>🔄</span>
            <span>This lecture repeats weekly at the same time</span>
        </div>
    );
}

function EnrollmentAction({ is_enrolled, onEnroll, onUnenroll }) {
    return is_enrolled
        ? <button className={styles.unenrollButton} onClick={onUnenroll}>Leave module</button>
        : <button className={styles.enrollButton} onClick={onEnroll}>Enrol in module</button>;
}

function DeadlineItem({ deadline, index }) {
    const urgency = getUrgencyLabel(deadline.start_due_date);
    return (
        <div className={deadlineStyles.deadlineItem}>
            <span className={deadlineStyles.deadlineIndex}>{index + 1}</span>
            <div className={deadlineStyles.deadlineBody}>
                <div className={deadlineStyles.deadlineTitleRow}>
                    <span className={deadlineStyles.deadlinesType}>{DEADLINE_LABELS[deadline.deadline_type]}</span>
                    <span className={deadlineStyles.deadlineTitle}>{deadline.title}</span>
                </div>
                <div className={deadlineStyles.deadlineMeta}>
                    <span className={`${deadlineStyles.urgencyTag} ${deadlineStyles[urgency]}`}>{getUrgencyText(urgency)}</span>
                    <span className={deadlineStyles.deadlineDate}>{formatDeadlineDateTime(deadline.start_due_date)}</span>
                </div>
            </div>
        </div>
    );
}

function DeadlinesSection({ deadlines }) {
    if (!deadlines?.length) return <p className={deadlineStyles.emptyText}>No assignments yet.</p>;
    return (
        <div className={deadlineStyles.deadlinesList}>
            {deadlines.map((d, i) => <DeadlineItem key={d.id} deadline={d} index={i} />)}
        </div>
    );
}

function ReadingsSection({ readings }) {
    if (!readings?.length) return <p className={deadlineStyles.descriptionText}>No readings assigned yet.</p>;
    const sorted = [...readings].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    return (
        <div className={deadlineStyles.deadlinesList}>
            {sorted.map((r, i) => <ReadingRow key={r.id} reading={r} index={i} />)}
        </div>
    );
}

function ReadingRow({ reading, index }) {
    return (
        <div className={deadlineStyles.deadlineItem}>
            <span className={deadlineStyles.deadlineIndex}>{index + 1}</span>
            <div className={deadlineStyles.deadlineBody}>
                <div className={deadlineStyles.deadlineTitleRow}>
                    <span className={deadlineStyles.deadlinesType}>📖 Reading</span>
                    <span className={deadlineStyles.deadlineTitle}>{reading.title}</span>
                </div>
                <span className={deadlineStyles.deadlineDate}>
                    {reading.start_page != null && reading.end_page != null
                        ? `pp. ${reading.start_page}–${reading.end_page}`
                        : reading.page_count ? `${reading.page_count} pages` : ''}
                    {' · '}Due {formatDate(new Date(reading.deadline))}
                </span>
            </div>
        </div>
    );
}
