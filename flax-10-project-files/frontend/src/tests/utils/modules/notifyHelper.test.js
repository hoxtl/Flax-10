import { describe, it, expect, vi } from 'vitest';
import { createNotify } from '../../../components/modules/utils/notifyHelper';

describe('createNotify', () => {
    it('calls addNotification with Done title for non-error', () => {
        const addNotification = vi.fn();
        const notify = createNotify(addNotification);
        notify('Saved successfully', 'success');
        expect(addNotification).toHaveBeenCalledWith({
            title: '✓ Done',
            message: 'Saved successfully',
        });
    });

    it('calls addNotification with Action failed title for error', () => {
        const addNotification = vi.fn();
        const notify = createNotify(addNotification);
        notify('Something went wrong', 'error');
        expect(addNotification).toHaveBeenCalledWith({
            title: '⚠️ Action failed',
            message: 'Something went wrong',
        });
    });
});
