import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSocietyDetail, buildHandlers } from '../../../../components/society/hooks/useSocietyDetail';
import { useSocietyCore } from '../../../../components/society/hooks/useSocietyCore';
import { useSocietyTags } from '../../../../components/society/hooks/useSocietyTags';
import { useSocietyEvents } from '../../../../components/society/hooks/useSocietyEvents';
import { useSocietyAnnouncements } from '../../../../components/society/hooks/useSocietyAnnouncements';
import { useSocietyMembers } from '../../../../components/society/hooks/useSocietyMembers';
import { useSocietyMembership } from '../../../../components/society/hooks/useSocietyMembership';

vi.mock('../../../../components/society/hooks/useSocietyCore', () => ({ useSocietyCore: vi.fn() }));
vi.mock('../../../../components/society/hooks/useSocietyTags', () => ({ useSocietyTags: vi.fn() }));
vi.mock('../../../../components/society/hooks/useSocietyEvents', () => ({ useSocietyEvents: vi.fn() }));
vi.mock('../../../../components/society/hooks/useSocietyAnnouncements', () => ({ useSocietyAnnouncements: vi.fn() }));
vi.mock('../../../../components/society/hooks/useSocietyMembers', () => ({ useSocietyMembers: vi.fn() }));
vi.mock('../../../../components/society/hooks/useSocietyMembership', () => ({ useSocietyMembership: vi.fn() }));

describe('useSocietyDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSocietyCore.mockReturnValue({ society: {}, setSociety: vi.fn(), fetchSociety: vi.fn() });
        useSocietyTags.mockReturnValue({});
        useSocietyEvents.mockReturnValue({});
        useSocietyAnnouncements.mockReturnValue({});
        useSocietyMembers.mockReturnValue({});
        useSocietyMembership.mockReturnValue({});
    });

    it('orchestrates sub-hooks correctly', () => {
        renderHook(() => useSocietyDetail(1));
        expect(useSocietyCore).toHaveBeenCalledWith(1);
        expect(useSocietyTags).toHaveBeenCalled();
        expect(useSocietyEvents).toHaveBeenCalled();
        expect(useSocietyAnnouncements).toHaveBeenCalled();
        expect(useSocietyMembers).toHaveBeenCalled();
        expect(useSocietyMembership).toHaveBeenCalled();
    });
});

describe('buildHandlers', () => {
    const mockTracker = { trackAnnouncement: vi.fn(), trackEvent: vi.fn() };
    const mockData = {
        addAnnouncement: vi.fn(),
        updateAnnouncement: vi.fn(),
        deleteAnnouncement: vi.fn(),
        addEvent: vi.fn(),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn(),
        addException: vi.fn(),
        addTag: vi.fn(),
        deleteTag: vi.fn(),
        updateTag: vi.fn(),
        society: { announcements: [{ id: 10, title: 'A1' }] }
    };

    it('wraps announcement and event operations with tracking', async () => {
        const handlers = buildHandlers(mockData, false, mockTracker);
        
        await handlers.addAnnouncement({ title: 'New A' });
        expect(mockTracker.trackAnnouncement).toHaveBeenCalledWith('Added', 'New A');
        expect(mockData.addAnnouncement).toHaveBeenCalledWith({ title: 'New A' }, false);

        await handlers.updateAnnouncement(10, { title: 'Up A' });
        expect(mockTracker.trackAnnouncement).toHaveBeenCalledWith('Updated', 'Up A');

        await handlers.deleteAnnouncement(10);
        expect(mockTracker.trackAnnouncement).toHaveBeenCalledWith('Deleted', 'A1');

        await handlers.addEvent({ title: 'New E' });
        expect(mockTracker.trackEvent).toHaveBeenCalledWith('Added', 'New E');

        await handlers.updateEvent(100, { title: 'Up E' });
        expect(mockTracker.trackEvent).toHaveBeenCalledWith('Updated', 'Up E');

        await handlers.deleteEvent(100, 'Del E');
        expect(mockTracker.trackEvent).toHaveBeenCalledWith('Deleted', 'Del E');

        await handlers.addException(100, {});
        expect(mockData.addException).toHaveBeenCalled();
    });

    it('handles missing tracker or titles gracefully', async () => {
        const handlers = buildHandlers(mockData, true, null);
        await handlers.addAnnouncement({ title: 'A' });
        expect(mockData.addAnnouncement).toHaveBeenCalledWith({ title: 'A' }, true);
        
        await handlers.deleteAnnouncement(99); // No title found
        expect(mockData.deleteAnnouncement).toHaveBeenCalled();
    });
});
