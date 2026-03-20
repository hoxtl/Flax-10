import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, BookOpen, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { getUpcomingDeadlines } from '../../api/deadlineApi';
import { getSuggestedReadings, convertReadingToTask } from '../../api/readingApi';
import { createTask } from '../../api/taskService';
import { isEnrolledIn } from '../../components/Modules/utils/moduleUtils';
import { useCountUp } from '../../hooks/useCountUp';
import { useToast } from '../../context/ToastContext';
import PrimaryButton from '../../components/common/PrimaryButton/PrimaryButton';
import { TaskInfoModal } from '../Tasks/components/TaskInfoModal';
import styles from './MyModulesDashboard.module.css';

const DEADLINES_INITIAL_SHOWN = 4;
const READINGS_INITIAL_SHOWN = 4;

const expandBodyVariants = {
    collapsed: { opacity: 0, height: 0 },
    expanded: {
        opacity: 1,
        height: 'auto',
        transition: { duration: 0.26, ease: [0.23, 1, 0.32, 1] },
    },
};

function getDayCount(dueDate) {
    const ms = new Date(dueDate).getTime() - Date.now();
    return Math.floor(ms / 86400000);
}

function getUrgencyTier(dueDate) {
    const days = getDayCount(dueDate);
    if (days < 0) return 'overdue';
    if (days <= 2) return 'critical';
    if (days <= 5) return 'urgent';
    if (days <= 14) return 'upcoming';
    return 'distant';
}

function getDaysLabel(dueDate) {
    const days = getDayCount(dueDate);
    if (days < 0) {
        const over = Math.abs(days);
        return over === 0 ? 'Overdue' : over === 1 ? '1d overdue' : `${over}d overdue`;
    }
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days}d`;
}

const PRIORITY_PILL = {
    overdue: { label: 'Overdue', marks: '!!', cls: 'priorityPill_overdue' },
    critical: { label: 'Urgent', marks: '!!!', cls: 'priorityPill_critical' },
    urgent: null,
    upcoming: null,
    distant: null,
};

function getDueStatusClass(tier) {
    if (tier === 'overdue') return 'due_overdue';
    if (tier === 'critical') return 'due_today';
    if (tier === 'urgent') return 'due_tomorrow';
    return 'due_future';
}

const TIER_ACCENT = {
    overdue: 'var(--home-urgency-danger)',
    critical: 'var(--home-urgency-warning)',
    urgent: 'var(--home-urgency-warning)',
    upcoming: 'var(--home-urgency-neutral)',
    distant: 'var(--home-urgency-neutral-border)',
};

const listVariants = {
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};
const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};

function WidgetHeader({ icon: Icon, title, count }) {
    return (
        <div className={styles.widgetHeader}>
            <div className={styles.widgetIconWrap}>
                <Icon size={17} strokeWidth={1.85} aria-hidden />
            </div>
            <span className={styles.widgetTitle}>{title}</span>
            {count > 0 && <span className={styles.widgetCount}>{count}</span>}
        </div>
    );
}

function DeadlineRow({ deadline, isMostUrgent }) {
    const due = deadline.start_due_date;
    const tier = getUrgencyTier(due);
    const daysLabel = getDaysLabel(due);
    const title = deadline.assessment_title || deadline.title || 'Assignment';
    const moduleCode = deadline.module_code || '';
    const typeLabel = (deadline.deadline_type || 'assessment').toUpperCase();
    const urgentGlow = tier === 'overdue' || tier === 'critical';
    const pill = PRIORITY_PILL[tier];
    const dueCls = getDueStatusClass(tier);
    return (
        <motion.div
            className={`${styles.deadlineRow} ${tier === 'overdue' ? styles.rowOverdue : ''} ${tier === 'critical' ? styles.rowCritical : ''} ${urgentGlow ? styles.rowUrgentGlow : ''}`}
            style={{ '--deadline-row-accent': TIER_ACCENT[tier] }}
            variants={itemVariants}
        >
            <div className={styles.deadlineRowLeft}>
                <div className={styles.deadlinePills}>
                    {moduleCode && <Link to={`/modules?code=${encodeURIComponent(moduleCode)}`} className={styles.moduleCodePill} onClick={e => e.stopPropagation()}>{moduleCode}</Link>}
                    <span className={styles.typePill}>{typeLabel}</span>
                </div>
                <span className={styles.deadlineTitle}>{title}</span>
            </div>
            {pill && <span className={`${styles.priorityPill} ${styles[pill.cls]}`}>{pill.marks} {pill.label}</span>}
            <span className={`${styles.daysLabel} ${styles[dueCls]}`}>
                {(tier === 'overdue' || tier === 'critical' || tier === 'urgent') && <Clock size={11} className={styles.duePillIcon} />}
                {daysLabel}
            </span>
        </motion.div>
    );
}

function ShowMoreButton({ expanded, hiddenCount, onToggle }) {
    return (
        <motion.button
            type="button"
            className={styles.showMoreBtn}
            onClick={onToggle}
            whileTap={{ scale: 0.98 }}
        >
            {expanded ? (
                <><ChevronUp size={14} strokeWidth={2.5} aria-hidden /> Show less</>
            ) : (
                <><ChevronDown size={14} strokeWidth={2.5} aria-hidden /> + {hiddenCount} more</>
            )}
        </motion.button>
    );
}

function DeadlinesPanel({ deadlines }) {
    const [expanded, setExpanded] = useState(false);
    const sorted = useMemo(() => {
        const list = [...(deadlines || [])].filter(d => d.start_due_date);
        list.sort((a, b) => {
            const aTier = getUrgencyTier(a.start_due_date);
            const bTier = getUrgencyTier(b.start_due_date);
            const tierOrder = { overdue: 0, critical: 1, urgent: 2, upcoming: 3, distant: 4 };
            if (tierOrder[aTier] !== tierOrder[bTier]) return tierOrder[aTier] - tierOrder[bTier];
            return new Date(a.start_due_date).getTime() - new Date(b.start_due_date).getTime();
        });
        return list;
    }, [deadlines]);

    const initial = sorted.slice(0, DEADLINES_INITIAL_SHOWN);
    const extra = sorted.slice(DEADLINES_INITIAL_SHOWN);
    const hiddenCount = extra.length;

    return (
        <motion.div className={styles.widget} variants={containerVariants} initial="hidden" animate="visible">
            <WidgetHeader icon={AlertCircle} title="Upcoming Deadlines" count={sorted.length} />
            {sorted.length === 0 ? (
                <div className={styles.emptyState}>
                    <p className={styles.emptyMessage}>No upcoming deadlines</p>
                    <p className={styles.emptySub}>You're all caught up — enjoy the calm.</p>
                </div>
            ) : (
                <>
                    <motion.div className={styles.widgetList} initial="hidden" animate="visible" variants={listVariants}>
                        {initial.map((d, idx) => (
                            <DeadlineRow key={d.id} deadline={d} isMostUrgent={idx === 0} />
                        ))}
                        <AnimatePresence initial={false}>
                            {expanded && (
                                <motion.div
                                    className={styles.expandableRows}
                                    variants={expandBodyVariants}
                                    initial="collapsed"
                                    animate="expanded"
                                    exit="collapsed"
                                >
                                    <motion.div className={styles.expandableRowsInner} initial="hidden" animate="visible" variants={listVariants}>
                                        {extra.map((d) => (
                                            <DeadlineRow key={d.id} deadline={d} isMostUrgent={false} />
                                        ))}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                    {hiddenCount > 0 && (
                        <ShowMoreButton expanded={expanded} hiddenCount={hiddenCount} onToggle={() => setExpanded(p => !p)} />
                    )}
                </>
            )}
        </motion.div>
    );
}

function AddToTaskButton({ readingId, onAdded, className = '', variant = 'primary' }) {
    const [state, setState] = useState('idle');
    const toast = useToast();
    const handleAdd = async (e) => {
        e.stopPropagation();
        if (state !== 'idle') return;
        setState('loading');
        try {
            await convertReadingToTask(readingId);
            setState('added');
            onAdded?.(readingId);
            toast?.('Reading added to tasks!');
        } catch {
            setState('idle');
            toast?.('Failed to add reading.', { variant: 'error' });
        }
    };
    if (state === 'added') return <span className={styles.addedLabel}>✓ Added</span>;
    return (
        <PrimaryButton className={className} variant={variant} size="small" pill onClick={handleAdd} disabled={state === 'loading'}>
            {state === 'loading' ? 'Adding…' : '+ Add to tasks'}
        </PrimaryButton>
    );
}

function deadlineToTask(deadline) {
    const tier = deadline?.start_due_date ? getUrgencyTier(deadline.start_due_date) : 'upcoming';
    const priority = tier === 'overdue' || tier === 'critical' ? 'high' : tier === 'urgent' ? 'medium' : 'low';

    return {
        title: deadline?.assessment_title || deadline?.title || deadline?.module_code || 'Assignment',
        description: deadline?.description || '',
        priority,
        due_date: deadline?.start_due_date || null,
        module: deadline?.module ?? null,
        module_code: deadline?.module_code || null,
        module_name: deadline?.module_name || null,
        task_list: null,
        estimated_blocks: 1,
    };
}

function AddDeadlineToTaskButton({ deadline, onAdded, className = '', variant = 'secondary' }) {
    const [state, setState] = useState('idle');
    const toast = useToast();

    const handleAdd = async (e) => {
        e.stopPropagation();
        if (state !== 'idle') return;
        setState('loading');
        try {
            await createTask(deadlineToTask(deadline));
            setState('added');
            onAdded?.(deadline?.id);
            toast?.('Deadline added to tasks!');
        } catch {
            setState('idle');
            toast?.('Failed to add deadline.', { variant: 'error' });
        }
    };

    if (state === 'added') return <span className={styles.addedLabel}>✓ Added</span>;

    return (
        <PrimaryButton className={className} variant={variant} size="small" pill onClick={handleAdd} disabled={state === 'loading'}>
            {state === 'loading' ? 'Adding…' : '+ Add to tasks'}
        </PrimaryButton>
    );
}

function readingToTask(reading) {
    const pages = reading.page_count || (reading.end_page && reading.start_page ? reading.end_page - reading.start_page + 1 : null);
    return {
        title: reading.title,
        description: '',
        priority: 'medium',
        due_date: reading.deadline || reading.due_date || null,
        module_code: reading.module_code || null,
        module_name: reading.module_name || null,
        reading_chapter: reading.chapter || null,
        reading_start_page: reading.start_page || null,
        reading_end_page: reading.end_page || null,
        reading_page_count: pages,
        page_count: pages,
        estimated_blocks: null,
    };
}

function ReadingRow({ reading, isMostUrgent, onReadingAdded, onSelect }) {
    const dueDate = reading.deadline || reading.due_date;
    const daysLabel = dueDate ? getDaysLabel(dueDate) : null;
    const tier = dueDate ? getUrgencyTier(dueDate) : 'distant';
    const urgentGlow = isMostUrgent && dueDate && (tier === 'overdue' || tier === 'critical');
    const moduleName = reading.module_name || '';
    const pill = PRIORITY_PILL[tier];
    const dueCls = getDueStatusClass(tier);
    return (
        <motion.div
            className={`${styles.readingRow} ${styles.readingRowClickable} ${tier === 'overdue' ? styles.rowOverdue : ''} ${tier === 'critical' ? styles.rowCritical : ''} ${urgentGlow ? styles.rowUrgentGlow : ''}`}
            style={{ '--deadline-row-accent': TIER_ACCENT[tier], cursor: 'pointer' }}
            variants={itemVariants}
            onClick={() => onSelect?.(reading)}
        >
            <div className={styles.readingRowLeft}>
                <span className={styles.readingTitle}>{moduleName ? `${moduleName}: ${reading.title.replace(new RegExp(`^${moduleName}:\\s*`, 'i'), '')}` : reading.title}</span>
            </div>
            {pill && <span className={`${styles.priorityPill} ${styles[pill.cls]}`}>{pill.marks} {pill.label}</span>}
            {daysLabel && (
                <span className={`${styles.daysLabel} ${styles[dueCls]}`}>
                    {(tier === 'overdue' || tier === 'critical' || tier === 'urgent') && <Clock size={11} className={styles.duePillIcon} />}
                    {daysLabel}
                </span>
            )}
            <AddToTaskButton readingId={reading.id} onAdded={onReadingAdded} className={styles.readingAddButton} />
        </motion.div>
    );
}

function ReadingsPanel({ readings, onReadingAdded }) {
    const [expanded, setExpanded] = useState(false);
    const [selectedReading, setSelectedReading] = useState(null);
    const sorted = useMemo(() => {
        const list = [...(readings || [])];
        list.sort((a, b) => {
            const aDate = a.deadline || a.due_date || '9999';
            const bDate = b.deadline || b.due_date || '9999';
            return new Date(aDate).getTime() - new Date(bDate).getTime();
        });
        return list;
    }, [readings]);

    const initial = sorted.slice(0, READINGS_INITIAL_SHOWN);
    const extra = sorted.slice(READINGS_INITIAL_SHOWN);
    const hiddenCount = extra.length;

    return (
        <motion.div className={styles.widget} variants={containerVariants} initial="hidden" animate="visible">
            <WidgetHeader icon={BookOpen} title="Reading List" count={sorted.length} />
            {sorted.length === 0 ? (
                <div className={styles.emptyState}>
                    <p className={styles.emptyMessage}>No readings assigned</p>
                    <p className={styles.emptySub}>Your reading list will appear here when tutors add materials.</p>
                </div>
            ) : (
                <>
                    <motion.div className={styles.widgetList} initial="hidden" animate="visible" variants={listVariants}>
                        {initial.map((r, idx) => <ReadingRow key={r.id} reading={r} isMostUrgent={idx === 0} onReadingAdded={onReadingAdded} onSelect={setSelectedReading} />)}
                        <AnimatePresence initial={false}>
                            {expanded && (
                                <motion.div
                                    className={styles.expandableRows}
                                    variants={expandBodyVariants}
                                    initial="collapsed"
                                    animate="expanded"
                                    exit="collapsed"
                                >
                                    <motion.div className={styles.expandableRowsInner} initial="hidden" animate="visible" variants={listVariants}>
                                        {extra.map((r) => (
                                            <ReadingRow key={r.id} reading={r} isMostUrgent={false} onReadingAdded={onReadingAdded} onSelect={setSelectedReading} />
                                        ))}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                    {hiddenCount > 0 && (
                        <ShowMoreButton expanded={expanded} hiddenCount={hiddenCount} onToggle={() => setExpanded(p => !p)} />
                    )}
                </>
            )}
            {selectedReading && (
                <TaskInfoModal
                    task={readingToTask(selectedReading)}
                    listName={selectedReading.module_name || null}
                    onClose={() => setSelectedReading(null)}
                />
            )}
        </motion.div>
    );
}

function SmartNudge({ deadlines, readings, onReadingAdded }) {
    const [dismissed, setDismissed] = useState(new Set());
    const nudgeItem = useMemo(() => {
        const items = [];
        for (const d of deadlines || []) {
            if (!d.start_due_date) continue;
            const days = getDayCount(d.start_due_date);
            if (days >= 0 && days <= 7) {
                items.push({ type: 'deadline', title: d.assessment_title || d.title, code: d.module_code, days, deadline: d, id: `d-${d.id}` });
            }
        }
        for (const r of readings || []) {
            const due = r.deadline || r.due_date;
            if (!due) continue;
            const days = getDayCount(due);
            if (days >= 0 && days <= 7) {
                items.push({ type: 'reading', title: r.title, code: r.module_code, days, readingId: r.id, id: `r-${r.id}` });
            }
        }
        items.sort((a, b) => a.days - b.days);
        return items.find(i => !dismissed.has(i.id)) || null;
    }, [deadlines, readings, dismissed]);

    const handleReadingAdded = useCallback((readingId) => {
        setDismissed(prev => new Set(prev).add(`r-${readingId}`));
        onReadingAdded?.(readingId);
    }, [onReadingAdded]);

    const handleDeadlineAdded = useCallback((deadlineId) => {
        setDismissed(prev => new Set(prev).add(`d-${deadlineId}`));
    }, []);

    if (!nudgeItem) return null;
    const label = nudgeItem.days === 0 ? 'today' : nudgeItem.days === 1 ? 'tomorrow' : `in ${nudgeItem.days} days`;
    return (
        <motion.div className={styles.nudgeBanner} key={nudgeItem.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35 }}>
            <span className={styles.nudgeIcon}>⚡</span>
            <span className={styles.nudgeText}>
                <strong>{nudgeItem.code ? `${nudgeItem.code}: ` : ''}{nudgeItem.title}</strong> is due {label} — focus on it this week.
            </span>
            <div className={styles.nudgeActions}>
                {nudgeItem.type === 'deadline' && nudgeItem.deadline && (
                    <AddDeadlineToTaskButton deadline={nudgeItem.deadline} onAdded={handleDeadlineAdded} className={styles.nudgeAddButton} variant="primary" />
                )}
                {nudgeItem.type === 'reading' && nudgeItem.readingId && (
                    <AddToTaskButton readingId={nudgeItem.readingId} onAdded={handleReadingAdded} className={styles.nudgeAddButton} variant="primary" />
                )}
            </div>
        </motion.div>
    );
}

function AnimatedStat({ value, label, delay = 0 }) {
    const ref = useCountUp(value, 1200);
    return (
        <motion.div
            className={styles.statCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
        >
            <span className={styles.statValue} ref={ref}>0</span>
            <span className={styles.statLabel}>{label}</span>
        </motion.div>
    );
}

export default function MyModulesDashboard({ modules, enrollments }) {
    const [deadlines, setDeadlines] = useState([]);
    const [readings, setReadings] = useState([]);

    useEffect(() => {
        getUpcomingDeadlines()
            .then(list => setDeadlines(list || []))
            .catch(() => setDeadlines([]));
        getSuggestedReadings()
            .then(list => setReadings(list || []))
            .catch(() => setReadings([]));
    }, []);

    const handleReadingAdded = useCallback((readingId) => {
        setReadings(prev => prev.filter(r => r.id !== readingId));
    }, []);

    const enrolledCount = useMemo(() => {
        if (!modules || !enrollments) return 0;
        return modules.filter(m => isEnrolledIn(m.id, enrollments)).length;
    }, [modules, enrollments]);

    return (
        <motion.div className={styles.dashboard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            <SmartNudge deadlines={deadlines} readings={readings} onReadingAdded={handleReadingAdded} />
            <div className={styles.statsRow}>
                <AnimatedStat value={enrolledCount} label="Enrolled modules" delay={0.1} />
                <div className={styles.statSep} />
                <AnimatedStat value={deadlines.length} label="Upcoming assignment deadlines" delay={0.2} />
                <div className={styles.statSep} />
                <AnimatedStat value={readings.length} label="Readings to do" delay={0.3} />
            </div>
            <div className={styles.widgetRow}>
                <DeadlinesPanel deadlines={deadlines} />
                <ReadingsPanel readings={readings} onReadingAdded={handleReadingAdded} />
            </div>
        </motion.div>
    );
}
