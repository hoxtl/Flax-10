import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitAutoSchedule } from '../../../components/Schedules/auto/submitAutoSchedule';

vi.mock('../../../api/scheduleApi', () => ({
    createSchedule: vi.fn(),
}));

import { createSchedule } from '../../../api/scheduleApi';

describe('submitAutoSchedule', () => {
    let showToast;
    let onDone;

    beforeEach(() => {
        vi.clearAllMocks();
        showToast = vi.fn();
        onDone = vi.fn();
    });

    it('shows error toast and does not call createSchedule when deadlines is empty', async () => {
        await submitAutoSchedule({ title: 'X', deadlines: [], showToast, onDone });
        expect(showToast).toHaveBeenCalledWith('No upcoming deadlines to auto-schedule.', { variant: 'error' });
        expect(createSchedule).not.toHaveBeenCalled();
        expect(onDone).not.toHaveBeenCalled();
    });

    it('creates schedule, shows success toast, and calls onDone on valid input', async () => {
        createSchedule.mockResolvedValue({ overwritten: false });
        await submitAutoSchedule({ title: 'Exam Plan', deadlines: [{ id: 1 }], showToast, onDone });
        expect(createSchedule).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith('Your auto schedule is ready.', { variant: 'success' });
        expect(onDone).toHaveBeenCalled();
    });

    it('shows info toast when schedule was overwritten', async () => {
        createSchedule.mockResolvedValue({ overwritten: true });
        await submitAutoSchedule({ title: 'Plan B', deadlines: [{ id: 1 }], showToast, onDone });
        expect(showToast).toHaveBeenCalledWith(
            'A schedule with this name existed and was replaced.',
            { variant: 'info' },
        );
        expect(showToast).toHaveBeenCalledWith('Your auto schedule is ready.', { variant: 'success' });
    });

    it('does not call onDone when deadlines validation fails', async () => {
        await submitAutoSchedule({ title: '', deadlines: [], showToast, onDone });
        expect(onDone).not.toHaveBeenCalled();
    });

    it('calls onDone with undefined when onDone is not provided', async () => {
        createSchedule.mockResolvedValue({ overwritten: false });
        // should not throw
        await expect(
            submitAutoSchedule({ title: 'Plan', deadlines: [{ id: 1 }], showToast, onDone: undefined })
        ).resolves.not.toThrow();
    });
});
