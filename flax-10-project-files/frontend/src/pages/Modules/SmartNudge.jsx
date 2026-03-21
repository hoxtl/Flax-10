/*
 * Smart nudge banner for urgent deadlines or readings due within 7 days.
 */
import { useState, useMemo, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { getDayCount, getUrgencyTier } from '../../components/Modules/Deadlines/upcomingDeadlinesUtils';
import { AddReadingToTasksButton } from '../../components/Modules/shared/taskButtons.jsx';
import { createTask } from '../../api/taskApi';
import { useToast } from '../../context/ToastContext';
import PrimaryButton from '../../components/common/PrimaryButton/PrimaryButton';
import dashStyles from './MyModulesDashboard.module.css';
import rowStyles from './DashboardRows.module.css';

const styles = { ...dashStyles, ...rowStyles };

function deadlineToTask(deadline) {
    const tier = deadline?.start_due_date ? getUrgencyTier(deadline.start_due_date) : 'upcoming';
    const priority = tier === 'overdue' || tier === 'critical' ? 'high' : tier === 'urgent' ? 'medium' : 'low';
    return {
        title: deadline?.assessment_title || deadline?.title || deadline?.module_code || 'Assignment',
        description: '',
        priority,
        due_date: deadline?.start_due_date || null,
        module: deadline?.module ?? null,
        module_code: deadline?.module_code || null,
        module_name: deadline?.module_name || null,
        task_list: null,
        estimated_blocks: 1,
    };
}

async function submitDeadlineAsTask(deadline, setState, onAdded, toast) {
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
}

function AddDeadlineToTaskButton({ deadline, onAdded, className = '', variant = 'secondary' }) {
    const [state, setState] = useState('idle');
    const toast = useToast();

    const handleAdd = (e) => {
        e.stopPropagation();
        if (state === 'idle') submitDeadlineAsTask(deadline, setState, onAdded, toast);
    };

    if (state === 'added') return <span className={styles.addedLabel}>✓ Added</span>;
    return (
        <PrimaryButton className={className} variant={variant} size="small" pill onClick={handleAdd} disabled={state === 'loading'}>
            {state === 'loading' ? 'Adding…' : '+ Add to tasks'}
        </PrimaryButton>
    );
}

function collectDeadlineNudges(deadlines) {
    return (deadlines || [])
        .filter(d => d.start_due_date)
        .map(d => ({ days: getDayCount(d.start_due_date), d }))
        .filter(({ days }) => days >= 0 && days <= 7)
        .map(({ days, d }) => ({
            type: 'deadline',
            title: d.assessment_title || d.title,
            code: d.module_code,
            days,
            deadline: d,
            id: `d-${d.id}`,
        }));
}

function collectReadingNudges(readings) {
    return (readings || [])
        .map(r => ({ due: r.deadline || r.due_date, r }))
        .filter(({ due }) => due)
        .map(({ due, r }) => ({ days: getDayCount(due), r }))
        .filter(({ days }) => days >= 0 && days <= 7)
        .map(({ days, r }) => ({
            type: 'reading',
            title: r.title,
            code: r.module_code,
            days,
            readingId: r.id,
            id: `r-${r.id}`,
        }));
}

function findTopNudge(deadlines, readings, dismissed) {
    const items = [...collectDeadlineNudges(deadlines), ...collectReadingNudges(readings)];
    items.sort((a, b) => a.days - b.days);
    return items.find(i => !dismissed.has(i.id)) || null;
}

function dueLabel(days) {
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    return `in ${days} days`;
}

function NudgeBannerContent({ nudgeItem, onDeadlineAdded, onReadingAdded }) {
    return (
        <>
            <span className={styles.nudgeIcon}>⚡</span>
            <span className={styles.nudgeText}>
                <strong>{nudgeItem.code ? `${nudgeItem.code}: ` : ''}{nudgeItem.title}</strong> is due {dueLabel(nudgeItem.days)} — focus on it this week.
            </span>
            <NudgeActions nudgeItem={nudgeItem} onDeadlineAdded={onDeadlineAdded} onReadingAdded={onReadingAdded} />
        </>
    );
}

function NudgeActions({ nudgeItem, onDeadlineAdded, onReadingAdded }) {
    return (
        <div className={styles.nudgeActions}>
            {nudgeItem.type === 'deadline' && nudgeItem.deadline && (
                <AddDeadlineToTaskButton deadline={nudgeItem.deadline} onAdded={onDeadlineAdded} className={styles.nudgeAddButton} variant="primary" />
            )}
            {nudgeItem.type === 'reading' && nudgeItem.readingId && (
                <AddReadingToTasksButton readingId={nudgeItem.readingId} onAdded={onReadingAdded} className={styles.nudgeAddButton} variant="primary" styles={styles} />
            )}
        </div>
    );
}

export default function SmartNudge({ deadlines, readings, onReadingAdded }) {
    const [dismissed, setDismissed] = useState(new Set());
    const nudgeItem = useMemo(() => findTopNudge(deadlines, readings, dismissed), [deadlines, readings, dismissed]);

    const handleReadingAdded = useCallback((readingId) => {
        setDismissed(prev => new Set(prev).add(`r-${readingId}`));
        onReadingAdded?.(readingId);
    }, [onReadingAdded]);

    const handleDeadlineAdded = useCallback((deadlineId) => {
        setDismissed(prev => new Set(prev).add(`d-${deadlineId}`));
    }, []);

    if (!nudgeItem) return null;
    return (
        <Motion.div className={styles.nudgeBanner} key={nudgeItem.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.35 }}>
            <NudgeBannerContent nudgeItem={nudgeItem} onDeadlineAdded={handleDeadlineAdded} onReadingAdded={handleReadingAdded} />
        </Motion.div>
    );
}
