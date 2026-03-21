/* Readings panel — sorted reading list with expand/collapse and task conversion. */
import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { convertReadingToTask } from '../../api/readingApi';
import {
    PRIORITY_PILL,
    TIER_ACCENT,
    getDaysLabel,
    getDueStatusClass,
    getUrgencyTier,
} from '../../components/Modules/Deadlines/upcomingDeadlinesUtils';
import { useToast } from '../../context/ToastContext';
import PrimaryButton from '../../components/common/PrimaryButton/PrimaryButton';
import { TaskInfoModal } from '../Tasks/components/TaskInfoModal';
import dashStyles from './MyModulesDashboard.module.css';
import rowStyles from './DashboardRows.module.css';
const styles = { ...dashStyles, ...rowStyles };

const READINGS_INITIAL_SHOWN = 4;

const expandBodyVariants = {
    collapsed: { opacity: 0, height: 0 },
    expanded: {
        opacity: 1,
        height: 'auto',
        transition: { duration: 0.26, ease: [0.23, 1, 0.32, 1] },
    },
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

function ShowMoreButton({ expanded, hiddenCount, onToggle }) {
    return (
        <motion.button type="button" className={styles.showMoreBtn} onClick={onToggle} whileTap={{ scale: 0.98 }}>
            {expanded
                ? <><ChevronUp size={14} strokeWidth={2.5} aria-hidden /> Show less</>
                : <><ChevronDown size={14} strokeWidth={2.5} aria-hidden /> + {hiddenCount} more</>}
        </motion.button>
    );
}

async function submitReadingAsTask(readingId, setState, onAdded, toast) {
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
}

export function AddToTaskButton({ readingId, onAdded, className = '', variant = 'primary' }) {
    const [state, setState] = useState('idle');
    const toast = useToast();

    const handleAdd = (e) => {
        e.stopPropagation();
        if (state === 'idle') submitReadingAsTask(readingId, setState, onAdded, toast);
    };

    if (state === 'added') return <span className={styles.addedLabel}>✓ Added</span>;
    return (
        <PrimaryButton className={className} variant={variant} size="small" pill onClick={handleAdd} disabled={state === 'loading'}>
            {state === 'loading' ? 'Adding…' : '+ Add to tasks'}
        </PrimaryButton>
    );
}

function readingToTask(reading) {
    const pages = reading.page_count || computePageCount(reading);
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

function computePageCount(reading) {
    if (reading.end_page && reading.start_page) return reading.end_page - reading.start_page + 1;
    return null;
}

function buildReadingTitle(reading) {
    const moduleName = reading.module_name || '';
    if (!moduleName) return reading.title;
    return `${moduleName}: ${reading.title.replace(new RegExp(`^${moduleName}:\\s*`, 'i'), '')}`;
}

function rowClassName(tier, urgentGlow) {
    const parts = [styles.readingRow, styles.readingRowClickable];
    if (tier === 'overdue') parts.push(styles.rowOverdue);
    if (tier === 'critical') parts.push(styles.rowCritical);
    if (urgentGlow) parts.push(styles.rowUrgentGlow);
    return parts.join(' ');
}

function isUrgentTier(tier) {
    return tier === 'overdue' || tier === 'critical' || tier === 'urgent';
}

function ReadingRowMeta({ tier, daysLabel }) {
    const pill = PRIORITY_PILL[tier];
    const dueCls = getDueStatusClass(tier);
    return (
        <>
            {pill && <span className={`${styles.priorityPill} ${styles[pill.cls]}`}>{pill.marks} {pill.label}</span>}
            {daysLabel && (
                <span className={`${styles.daysLabel} ${styles[dueCls]}`}>
                    {isUrgentTier(tier) && <Clock size={11} className={styles.duePillIcon} />}
                    {daysLabel}
                </span>
            )}
        </>
    );
}

function ReadingRow({ reading, isMostUrgent, onReadingAdded, onSelect }) {
    const dueDate = reading.deadline || reading.due_date;
    const daysLabel = dueDate ? getDaysLabel(dueDate) : null;
    const tier = dueDate ? getUrgencyTier(dueDate) : 'distant';
    const urgentGlow = isMostUrgent && dueDate && (tier === 'overdue' || tier === 'critical');
    return (
        <motion.div
            className={rowClassName(tier, urgentGlow)}
            style={{ '--deadline-row-accent': TIER_ACCENT[tier], cursor: 'pointer' }}
            variants={itemVariants}
            onClick={() => onSelect?.(reading)}
        >
            <div className={styles.readingRowLeft}>
                <span className={styles.readingTitle}>{buildReadingTitle(reading)}</span>
            </div>
            <ReadingRowMeta tier={tier} daysLabel={daysLabel} />
            <AddToTaskButton readingId={reading.id} onAdded={onReadingAdded} className={styles.readingAddButton} />
        </motion.div>
    );
}

function sortByDueDate(readings) {
    const list = [...(readings || [])];
    list.sort((a, b) => {
        const aDate = a.deadline || a.due_date || '9999';
        const bDate = b.deadline || b.due_date || '9999';
        return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
    return list;
}

function EmptyReadings() {
    return (
        <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>No readings assigned</p>
            <p className={styles.emptySub}>Your reading list will appear here when tutors add materials.</p>
        </div>
    );
}

function ReadingsList({ initial, extra, expanded, onToggle, onReadingAdded, onSelect }) {
    return (
        <>
            <motion.div className={styles.widgetList} initial="hidden" animate="visible" variants={listVariants}>
                {initial.map((r, idx) => (
                    <ReadingRow key={r.id} reading={r} isMostUrgent={idx === 0} onReadingAdded={onReadingAdded} onSelect={onSelect} />
                ))}
                <ExpandableRows extra={extra} expanded={expanded} onReadingAdded={onReadingAdded} onSelect={onSelect} />
            </motion.div>
            {extra.length > 0 && <ShowMoreButton expanded={expanded} hiddenCount={extra.length} onToggle={onToggle} />}
        </>
    );
}

function ExpandableRows({ extra, expanded, onReadingAdded, onSelect }) {
    return (
        <AnimatePresence initial={false}>
            {expanded && (
                <motion.div className={styles.expandableRows} variants={expandBodyVariants} initial="collapsed" animate="expanded" exit="collapsed">
                    <motion.div className={styles.expandableRowsInner} initial="hidden" animate="visible" variants={listVariants}>
                        {extra.map((r) => (
                            <ReadingRow key={r.id} reading={r} isMostUrgent={false} onReadingAdded={onReadingAdded} onSelect={onSelect} />
                        ))}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function ReadingsPanel({ readings, onReadingAdded }) {
    const [expanded, setExpanded] = useState(false);
    const [selectedReading, setSelectedReading] = useState(null);
    const sorted = useMemo(() => sortByDueDate(readings), [readings]);
    const initial = sorted.slice(0, READINGS_INITIAL_SHOWN);
    const extra = sorted.slice(READINGS_INITIAL_SHOWN);

    return (
        <motion.div className={styles.widget} variants={containerVariants} initial="hidden" animate="visible">
            <WidgetHeader icon={BookOpen} title="Reading List" count={sorted.length} />
            {sorted.length === 0
                ? <EmptyReadings />
                : <ReadingsList initial={initial} extra={extra} expanded={expanded} onToggle={() => setExpanded(p => !p)} onReadingAdded={onReadingAdded} onSelect={setSelectedReading} />}
            {selectedReading && (
                <TaskInfoModal task={readingToTask(selectedReading)} listName={selectedReading.module_name || null} onClose={() => setSelectedReading(null)} />
            )}
        </motion.div>
    );
}
