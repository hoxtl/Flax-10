/*
 * Readings panel with sorted reading list, expand/collapse, and task conversion.
 */
<<<<<<< HEAD

import { useState, useMemo } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import DeadlineCountdown from '../../components/common/deadline_countdown/DeadlineCountdown';
import urgentGlowStyles from '../../components/common/urgent_glow/UrgentGlow.module.css';
import {
    TIER_ACCENT,
    getUrgencyTier,
} from '../../components/modules/deadlines/upcomingDeadlinesUtils';
import { AddReadingToTasksButton } from '../../components/modules/shared/taskButtons.jsx';
=======
import { useState, useMemo } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { BookOpen, Clock } from 'lucide-react';
import {
    PRIORITY_PILL,
    TIER_ACCENT,
    getDaysLabel,
    getDueStatusClass,
    getUrgencyTier,
} from '../../components/Modules/Deadlines/upcomingDeadlinesUtils';
import { AddReadingToTasksButton } from '../../components/Modules/shared/taskButtons.jsx';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import {
    containerVariants,
    expandBodyVariants,
    itemVariants,
    listVariants,
<<<<<<< HEAD
} from '../../components/modules/shared/widgetVariants.js';
import {
    WidgetHeader,
    ShowMoreButton,
} from '../../components/modules/shared/widgetParts.jsx';
import { TaskInfoModal } from '../tasks/components/TaskInfoModal';
import widgetStyles from './DashboardWidgets.module.css';
import rowStyles from './DashboardRows.module.css';

const styles = { ...widgetStyles, ...rowStyles };

function getReadingRowStyle(tier) { return { '--deadline-row-accent': TIER_ACCENT[tier], cursor: 'pointer' }; }
=======
} from '../../components/Modules/shared/widgetVariants.js';
import {
    WidgetHeader,
    ShowMoreButton,
} from '../../components/Modules/shared/widgetParts.jsx';
import { TaskInfoModal } from '../Tasks/components/TaskInfoModal';
import dashStyles from './MyModulesDashboard.module.css';
import rowStyles from './DashboardRows.module.css';

const styles = { ...dashStyles, ...rowStyles };
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

const READINGS_INITIAL_SHOWN = 4;

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
<<<<<<< HEAD
    const moduleName = String(reading.module_name || '').trim();
    const title = String(reading.title || '').trim();
    if (!moduleName) return title;
    return title.replace(new RegExp(`^${moduleName}:\\s*`, 'i'), '').trim();
=======
    const moduleName = reading.module_name || '';
    if (!moduleName) return reading.title;
    return `${moduleName}: ${reading.title.replace(new RegExp(`^${moduleName}:\\s*`, 'i'), '')}`;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function rowClassName(tier, urgentGlow) {
    const parts = [styles.readingRow, styles.readingRowClickable];
    if (tier === 'overdue') parts.push(styles.rowOverdue);
    if (tier === 'critical') parts.push(styles.rowCritical);
<<<<<<< HEAD
    if (urgentGlow) parts.push(urgentGlowStyles.urgentGlow);
    return parts.join(' ');
}

function ReadingRowMeta({ tier, dueDate }) {
    return (
        <div className={styles.widgetRowMeta}>
            <DeadlineCountdown dueDate={dueDate} tier={tier} showPriority={false} />
        </div>
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    );
}

function ReadingRow({ reading, isMostUrgent, onReadingAdded, onSelect }) {
    const dueDate = reading.deadline || reading.due_date;
<<<<<<< HEAD
=======
    const daysLabel = dueDate ? getDaysLabel(dueDate) : null;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    const tier = dueDate ? getUrgencyTier(dueDate) : 'distant';
    const urgentGlow = isMostUrgent && dueDate && (tier === 'overdue' || tier === 'critical');
    return (
        <Motion.div
            className={rowClassName(tier, urgentGlow)}
<<<<<<< HEAD
            style={getReadingRowStyle(tier)}
=======
            style={{ '--deadline-row-accent': TIER_ACCENT[tier], cursor: 'pointer' }}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
            variants={itemVariants}
            onClick={() => onSelect?.(reading)}
        >
            <div className={styles.readingRowLeft}>
                <span className={styles.readingTitle}>{buildReadingTitle(reading)}</span>
            </div>
<<<<<<< HEAD
            <ReadingRowMeta tier={tier} dueDate={dueDate} />
=======
            <ReadingRowMeta tier={tier} daysLabel={daysLabel} />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
            <AddReadingToTasksButton readingId={reading.id} onAdded={onReadingAdded} className={styles.readingAddButton} styles={styles} />
        </Motion.div>
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
            <Motion.div className={styles.widgetList} initial="hidden" animate="visible" variants={listVariants}>
                {initial.map((r, idx) => (
                    <ReadingRow key={r.id} reading={r} isMostUrgent={idx === 0} onReadingAdded={onReadingAdded} onSelect={onSelect} />
                ))}
                <ExpandableRows extra={extra} expanded={expanded} onReadingAdded={onReadingAdded} onSelect={onSelect} />
            </Motion.div>
            {extra.length > 0 && <ShowMoreButton expanded={expanded} hiddenCount={extra.length} onToggle={onToggle} styles={styles} />}
        </>
    );
}

function ExpandableRows({ extra, expanded, onReadingAdded, onSelect }) {
    return (
        <AnimatePresence initial={false}>
            {expanded && (
                <Motion.div className={styles.expandableRows} variants={expandBodyVariants} initial="collapsed" animate="expanded" exit="collapsed">
                    <Motion.div className={styles.expandableRowsInner} initial="hidden" animate="visible" variants={listVariants}>
                        {extra.map((r) => (
                            <ReadingRow key={r.id} reading={r} isMostUrgent={false} onReadingAdded={onReadingAdded} onSelect={onSelect} />
                        ))}
                    </Motion.div>
                </Motion.div>
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
        <Motion.div className={styles.widget} variants={containerVariants} initial="hidden" animate="visible">
            <WidgetHeader icon={BookOpen} title="Reading List" count={sorted.length} styles={styles} />
<<<<<<< HEAD
            <p className={styles.readingCaption}>Suggested by your teachers to keep your reading focused and easy to action.</p>
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
            {sorted.length === 0
                ? <EmptyReadings />
                : <ReadingsList initial={initial} extra={extra} expanded={expanded} onToggle={() => setExpanded(p => !p)} onReadingAdded={onReadingAdded} onSelect={setSelectedReading} />}
            {selectedReading && (
                <TaskInfoModal task={readingToTask(selectedReading)} listName={selectedReading.module_name || null} onClose={() => setSelectedReading(null)} />
            )}
        </Motion.div>
    );
}
