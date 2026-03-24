import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitManualSchedule } from '../../../components/Schedules/manual/submitManualSchedule';

vi.mock('../../../api/scheduleApi', () => ({
    createSchedule: vi.fn(),
}));

import { createSchedule } from '../../../api/scheduleApi';

describe('submitManualSchedule', () => {
    let showToast;
    let onDone;

    beforeEach(() => {
        vi.clearAllMocks();
        showToast = vi.fn();
        onDone = vi.fn();
    });

    it('shows error when title is blank', async () => {
        await submitManualSchedule({ title: '', selected: [1], showToast, onDone });
        expect(showToast).toHaveBeenCalledWith('Please enter a schedule name.', { variant: 'error' });
        expect(createSchedule).not.toHaveBeenCalled();
    });

    it('shows error when selected is empty', async () => {
        await submitManualSchedule({ title: 'Plan', selected: [], showToast, onDone });
        expect(showToast).toHaveBeenCalledWith(
            'Select at least one event tagged as schedule.',
            { variant: 'error' },
        );
        expect(createSchedule).not.toHaveBeenCalled();
    });

    it('creates schedule with trimmed title and calls onDone on success', async () => {
        createSchedule.mockResolvedValue({ overwritten: false });
        await submitManualSchedule({ title: '  Revision  ', selected: [1, 2], showToast, onDone });
        expect(createSchedule).toHaveBeenCalledWith({
            mode: 'manual',
            title: 'Revision',
            event_ids: [1, 2],
        });
        expect(showToast).toHaveBeenCalledWith('Saved 2 events to "Revision".', { variant: 'success' });
        expect(onDone).toHaveBeenCalled();
    });

    it('shows info toast when schedule was overwritten', async () => {
        createSchedule.mockResolvedValue({ overwritten: true });
        await submitManualSchedule({ title: 'Plan A', selected: [1], showToast, onDone });
        expect(showToast).toHaveBeenCalledWith(
            'A schedule with this name existed and was replaced.',
            { variant: 'info' },
        );
    });

    it('does not throw when onDone is not provided', async () => {
        createSchedule.mockResolvedValue({ overwritten: false });
        await expect(
            submitManualSchedule({ title: 'Plan', selected: [1], showToast, onDone: undefined })
        ).resolves.not.toThrow();
    });

    it('includes correct event count in the success toast message', async () => {
        createSchedule.mockResolvedValue({ overwritten: false });
        await submitManualSchedule({ title: 'Three Events', selected: [1, 2, 3], showToast, onDone });
        expect(showToast).toHaveBeenCalledWith('Saved 3 events to "Three Events".', { variant: 'success' });
    });
});
