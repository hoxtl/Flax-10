import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocietyAnnouncements } from '../../../../components/Society/hooks/useSocietyAnnouncements';
import * as api from '../../../../api/societyApi';

vi.mock('../../../../api/societyApi', () => ({
    createAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    fetchSociety: vi.fn()
}));

describe('useSocietyAnnouncements', () => {
    const mockId = 1;
    let mockSoc = { id: 1, announcements: [], events: [] };
    let setSociety, eventOps;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSoc = { id: 1, announcements: [], events: [] };
        setSociety = vi.fn((updater) => {
            if (typeof updater === 'function') {
                mockSoc = updater(mockSoc);
            }
        });
        eventOps = {
            addEvent: vi.fn(),
            updateEvent: vi.fn(),
            deleteEvent: vi.fn()
        };
    });

    it('addAnnouncement with success sync', async () => {
        const newAnn = { id: 10, title: 'A' };
        api.createAnnouncement.mockResolvedValue(newAnn);
        eventOps.addEvent.mockResolvedValue({ id: 100 });
        const { result } = renderHook(() => useSocietyAnnouncements(mockId, setSociety, eventOps));
        
        await act(async () => {
            await result.current.addAnnouncement({ title: 'A', addAsEvent: true });
        });
        expect(api.createAnnouncement).toHaveBeenCalledWith(mockId, { title: 'A', addAsEvent: true }, false);
        expect(mockSoc.announcements[0].event_id).toBe(100);
    });

    it('updateAnnouncement and setEventId coverage', async () => {
        mockSoc.announcements = [{ id: 10, title: 'Old', event_id: 100 }];
        const updated = { id: 10, title: 'New', event_id: 100 };
        api.updateAnnouncement.mockResolvedValue(updated);
        const { result } = renderHook(() => useSocietyAnnouncements(mockId, setSociety, eventOps));
        
        await act(async () => {
            await result.current.updateAnnouncement(10, { title: 'New' });
        });
        expect(api.updateAnnouncement).toHaveBeenCalledWith(mockId, 10, { title: 'New' }, false);
        expect(mockSoc.announcements[0].title).toBe('New');

        // Test handleSync path where addAsEvent is false but event_id exists (deleteLinked)
        const updatedNoEvent = { id: 10, title: 'A', event_id: 100 }; // The updated object returned from API
        api.updateAnnouncement.mockResolvedValue(updatedNoEvent);
        eventOps.deleteEvent.mockResolvedValue({});
        await act(async () => {
            await result.current.updateAnnouncement(10, { title: 'A', addAsEvent: false });
        });
        expect(eventOps.deleteEvent).toHaveBeenCalledWith(100, true);
        expect(mockSoc.announcements[0].event_id).toBeNull();
    });

    it('deleteAnnouncement covers deletion and sync error', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockSoc.announcements = [{ id: 10, title: 'A', event_id: 100 }];
        api.fetchSociety.mockResolvedValue({ announcements: [{ id: 10, event_id: 100 }] });
        eventOps.deleteEvent.mockRejectedValue(new Error('fail'));
        api.deleteAnnouncement.mockResolvedValue({});
        
        const { result } = renderHook(() => useSocietyAnnouncements(mockId, setSociety, eventOps));
        await act(async () => {
            await result.current.deleteAnnouncement(10);
        });
        expect(api.deleteAnnouncement).toHaveBeenCalledWith(mockId, 10, false);
        expect(spy).toHaveBeenCalledWith('Failed to delete linked event:', expect.any(Error));
        expect(mockSoc.announcements).toHaveLength(0);
        spy.mockRestore();
    });

    it('handleSync update branch coverage', async () => {
        const ann = { id: 10, event_id: 100 };
        api.updateAnnouncement.mockResolvedValue(ann);
        eventOps.updateEvent.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyAnnouncements(mockId, setSociety, eventOps));
        
        await act(async () => {
            await result.current.updateAnnouncement(10, { addAsEvent: true });
        });
        expect(api.updateAnnouncement).toHaveBeenCalledWith(mockId, 10, { addAsEvent: true }, false);
        expect(eventOps.updateEvent).toHaveBeenCalledWith(100, expect.any(Object), true);
        expect(eventOps.updateEvent).toHaveBeenCalledWith(100, expect.any(Object), true);
    });

    it('handleSync catch branch coverage', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        api.createAnnouncement.mockResolvedValue({ id: 10 });
        eventOps.addEvent.mockRejectedValue(new Error('sync fail'));
        const { result } = renderHook(() => useSocietyAnnouncements(mockId, setSociety, eventOps));
        await act(async () => { await result.current.addAnnouncement({ addAsEvent: true }); });
        expect(spy).toHaveBeenCalledWith('Failed to sync event:', expect.any(Error));
        spy.mockRestore();
    });
});
