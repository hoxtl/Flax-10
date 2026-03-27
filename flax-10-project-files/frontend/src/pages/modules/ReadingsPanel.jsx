/*
 * Readings panel with sorted reading list, expand/collapse, and task conversion.
 */

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
import {
    containerVariants,
    expandBodyVariants,
    itemVariants,
    listVariants,
} from '../../components/modules/shared/widgetVariants.js';
import {
    WidgetHeader,
    ShowMoreButton,
} from '../../components/modules/shared/widgetParts.jsx';
import { TaskInfoModal } from '../tasks/components/TaskInfoModal';
import EmptyStateCard from '../homepage/components/EmptyStateCard';
import widgetStyles from './DashboardWidgets.module.css';
import rowStyles from './DashboardRows.module.css';

const styles = { ...widgetStyles, ...rowStyles };

function getReadingRowStyle(tier) { return { '--deadline-row-accent': TIER_ACCENT[tier], cursor: 'pointer' }; }

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
    const moduleName = String(reading.module_name || '').trim();
    const title = String(reading.title || '').trim();
    if (!moduleName) return title;
    return title.replace(new RegExp(`^${moduleName}:\\s*`, 'i'), '').trim();
}

function rowClassName(tier, urgentGlow) {
    const parts = [styles.readingRow, styles.readingRowClickable];
    if (tier === 'overdue') parts.push(styles.rowOverdue);
    if (tier === 'critical') parts.push(styles.rowCritical);
    if (urgentGlow) parts.push(urgentGlowStyles.urgentGlow);
    return parts.join(' ');
}

function ReadingRowMeta({ tier, dueDate }) {
    return (
        <div className={styles.widgetRowMeta}>
            <DeadlineCountdown dueDate={dueDate} tier={tier} showPriority={false} />
        </div>
    );
}

function ReadingRow({ reading, isMostUrgent, onReadingAdded, onSelect }) {
    const dueDate = reading.deadline || reading.due_date;
    const tier = dueDate ? getUrgencyTier(dueDate) : 'distant';
    const urgentGlow = isMostUrgent && dueDate && (tier === 'overdue' || tier === 'critical');
    return (
        <Motion.div
            className={rowClassName(tier, urgentGlow)}
            style={getReadingRowStyle(tier)}
            variants={itemVariants}
            onClick={() => onSelect?.(reading)}
        >
            <div className={styles.readingRowLeft}>
                <span className={styles.readingTitle}>{buildReadingTitle(reading)}</span>
            </div>
            <ReadingRowMeta tier={tier} dueDate={dueDate} />
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
    return <EmptyStateCard icon={BookOpen} message="No readings assigned" sub="Your reading list will appear here when tutors add materials." />;
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
            <p className={styles.readingCaption}>Suggested by your teachers to keep your reading focused and easy to action.</p>
            {sorted.length === 0
                ? <EmptyReadings />
                : <ReadingsList initial={initial} extra={extra} expanded={expanded} onToggle={() => setExpanded(p => !p)} onReadingAdded={onReadingAdded} onSelect={setSelectedReading} />}
            {selectedReading && (
                <TaskInfoModal task={readingToTask(selectedReading)} listName={selectedReading.module_name || null} onClose={() => setSelectedReading(null)} />
            )}
        </Motion.div>
    );
}
