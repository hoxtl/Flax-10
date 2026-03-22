/*
 * Shared task-conversion actions for module dashboard content.
 */
import { useState } from 'react';
import { convertReadingToTask } from '../../../api/tasks/readingApi';
import { useToast } from '../../../context/ToastContext';
import PrimaryButton from '../../Common/PrimaryButton/PrimaryButton';

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

/* Converts a reading into a task from shared module widgets. */
export function AddReadingToTasksButton({ readingId, onAdded, className = '', variant = 'primary', styles }) {
    const [state, setState] = useState('idle');
    const toast = useToast();
    const handleAdd = (event) => {
        event.stopPropagation();
        if (state === 'idle') submitReadingAsTask(readingId, setState, onAdded, toast);
    };
    if (state === 'added') return <span className={styles.addedLabel}>✓ Added</span>;
    return (
        <PrimaryButton className={className} variant={variant} size="small" pill onClick={handleAdd} disabled={state === 'loading'}>
            {state === 'loading' ? 'Adding…' : '+ Add to tasks'}
        </PrimaryButton>
    );
}
