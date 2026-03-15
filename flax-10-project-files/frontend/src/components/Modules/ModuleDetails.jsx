import { formatDuration, formatTime, getDepartment, getCourse } from './utils/moduleUtils.js';
import { DEADLINE_LABELS, formatDeadlineDateTime } from './utils/deadlineUtils.js';
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
    const tutorKey = `${tutorName || ""}`.trim().toLowerCase().replace(/^dr\.\s*/i, "");
    const fallbackIndex = Math.abs(
        [...`${moduleCode || "module"}-${tutorName || "tutor"}`]
            .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    );

    const tutorPhotos = {
        "alice miller": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
        "sam rahwan": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",
        "james murphy": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&h=96&q=80",
        "eric chen": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80",
        "hina patel": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80",
        "sarah wan": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&h=96&q=80",
        "ravi kapoor": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&h=96&q=80",
        "laura turner": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&h=96&q=80",
        "david nguyen": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=96&h=96&q=80",
        "olivia farrell": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=96&h=96&q=80",
        "maria khan": "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=96&h=96&q=80",
        "thomas brown": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=96&h=96&q=80",
        "aiko yamada": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=96&h=96&q=80",
        "felipe nunes": "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=96&h=96&q=80",
        "charlotte ellis": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=96&h=96&q=80",
        "benjamin kwame": "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=96&h=96&q=80",
        "hannah lewis": "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=96&h=96&q=80",
        "jin park": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=96&h=96&q=80",
        "adam smith": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&h=96&q=80",
    };

    const genericPhotos = [
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=96&h=96&q=80",
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=96&h=96&q=80",
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&h=96&q=80",
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=96&h=96&q=80",
    ];

    return tutorPhotos[tutorKey] || genericPhotos[fallbackIndex % genericPhotos.length];
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
                    <span className={styles.moduleCode}>{module.module_code}</span>
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
                            <span className={styles.heroMetaValue}>{module.created_by_name || "Unknown"}</span>
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
                        <DeadlinesSection deadlines={sortedDeadlines} />
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
                            {timelineProgress !== null ? `${timelineProgress}% through assignment timeline` : "Progress will appear when more deadlines are set"}
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

function DeadlinesSection({ deadlines }) {
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
                                <span className={styles.deadlineTitle}>{d.title}</span>
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
