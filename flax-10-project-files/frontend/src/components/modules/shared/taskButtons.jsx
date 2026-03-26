/*
 * Shared task-conversion actions for module dashboard content.
 */

import { useState } from 'react';
import { convertReadingToTask } from '../../../api/readingApi';
import { createTask } from '../../../api/taskApi';
import { getUrgencyTier } from '../Deadlines/upcomingDeadlinesUtils';
import { useToast } from '../../../context/ToastContext';
import PrimaryButton from '../../common/primary_button/PrimaryButton';

async function submitAsTask(setState, onAdded, toast, itemId, successMessage, errorMessage, submitTask) {
    setState('loading');
    try {
        await submitTask();
        setState('added');
        onAdded?.(itemId);
        toast?.(successMessage);
    } catch {
        setState('idle');
        toast?.(errorMessage, { variant: 'error' });
    }
}

function TaskActionButton({ state, className, variant, onClick, addedLabel, styles }) {
    if (state === 'added') return <span className={styles.addedLabel}>{addedLabel}</span>;
    return (
        <PrimaryButton className={className} variant={variant} size="small" pill onClick={onClick} disabled={state === 'loading'}>
            {state === 'loading' ? 'Adding…' : '+ Add to tasks'}
        </PrimaryButton>
    );
}

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

export function AddReadingToTasksButton({ readingId, onAdded, className = '', variant = 'primary', styles }) {
    const [state, setState] = useState('idle');
    const toast = useToast();
    const handleAdd = (event) => {
        event.stopPropagation();
        if (state === 'idle') {
            submitAsTask(
                setState,
                onAdded,
                toast,
                readingId,
                'Reading added to tasks!',
                'Failed to add reading.',
                () => convertReadingToTask(readingId),
            );
        }
    };
    return <TaskActionButton state={state} className={className} variant={variant} onClick={handleAdd} addedLabel="✓ Added" styles={styles} />;
}

function handleDeadlineAdd(event, state, setState, onAdded, toast, deadline) {
    event.stopPropagation();
    if (state === 'idle') submitAsTask(setState, onAdded, toast, deadline?.id, 'Deadline added to tasks!', 'Failed to add deadline.', () => createTask(deadlineToTask(deadline)));
}

export function AddDeadlineToTasksButton({ deadline, onAdded, className = '', variant = 'secondary', styles }) {
    const [state, setState] = useState('idle');
    const toast = useToast();
    const handleAdd = (event) => handleDeadlineAdd(event, state, setState, onAdded, toast, deadline);
    return <TaskActionButton state={state} className={className} variant={variant} onClick={handleAdd} addedLabel="✓ Added" styles={styles} />;
}
