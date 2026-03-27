import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadScheduleTaggedEvents } from '../../../components/schedules/manual/loadScheduleTaggedEvents';

vi.mock('../../../api/eventApi', () => ({
    getEvents: vi.fn(),
}));

import { getEvents } from '../../../api/eventApi';

describe('loadScheduleTaggedEvents', () => {
    let setEvents;
    let setSelected;
    let showToast;

    beforeEach(() => {
        vi.clearAllMocks();
        setEvents = vi.fn();
        setSelected = vi.fn();
        showToast = vi.fn();
    });

    it('filters events tagged as "schedule" (case-insensitive) and selects their IDs', async () => {
        const events = [
            { id: 1, tag_name: 'schedule' },
            { id: 2, tag_name: 'personal' },
            { id: 3, tag_name: 'Schedule' },
            { id: 4, tag_name: 'SCHEDULE' },
        ];
        getEvents.mockResolvedValue(events);

        await loadScheduleTaggedEvents(setEvents, setSelected, showToast);

        expect(setEvents).toHaveBeenCalledWith([events[0], events[2], events[3]]);
        expect(setSelected).toHaveBeenCalledWith([1, 3, 4]);
        expect(showToast).not.toHaveBeenCalled();
    });

    it('calls setEvents and setSelected with empty arrays when no schedule-tagged events exist', async () => {
        getEvents.mockResolvedValue([{ id: 1, tag_name: 'personal' }]);

        await loadScheduleTaggedEvents(setEvents, setSelected, showToast);

        expect(setEvents).toHaveBeenCalledWith([]);
        expect(setSelected).toHaveBeenCalledWith([]);
    });

    it('shows error toast when getEvents throws', async () => {
        getEvents.mockRejectedValue(new Error('Network error'));

        await loadScheduleTaggedEvents(setEvents, setSelected, showToast);

        expect(showToast).toHaveBeenCalledWith('Unable to load schedule-tagged events.', { variant: 'error' });
        expect(setEvents).not.toHaveBeenCalled();
        expect(setSelected).not.toHaveBeenCalled();
    });

    it('handles events with no tag_name (treats as non-schedule)', async () => {
        const events = [
            { id: 1, tag_name: null },
            { id: 2 },
            { id: 3, tag_name: 'schedule' },
        ];
        getEvents.mockResolvedValue(events);

        await loadScheduleTaggedEvents(setEvents, setSelected, showToast);

        expect(setEvents).toHaveBeenCalledWith([events[2]]);
        expect(setSelected).toHaveBeenCalledWith([3]);
    });
});
