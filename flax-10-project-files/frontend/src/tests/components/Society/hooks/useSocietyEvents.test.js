import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
<<<<<<< HEAD
import { useSocietyEvents } from '../../../../components/society/hooks/useSocietyEvents';
=======
import { useSocietyEvents } from '../../../../components/Society/hooks/useSocietyEvents';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import * as api from '../../../../api/societyApi';

vi.mock('../../../../api/societyApi', () => ({
    createSocietyEvent: vi.fn(),
    updateSocietyEvent: vi.fn(),
    deleteSocietyEvent: vi.fn(),
    addExceptionDate: vi.fn()
}));

describe('useSocietyEvents', () => {
    const mockId = 1;
    let mockSoc = { id: 1, events: [{ id: 100, title: 'E1' }] };
    let setSociety, fetchSociety;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSoc = { id: 1, events: [{ id: 100, title: 'E1' }] };
        setSociety = vi.fn((updater) => {
            if (typeof updater === 'function') {
                const prev = { ...mockSoc };
                const res = updater(prev);
                mockSoc.events = res.events;
            }
        });
        fetchSociety = vi.fn();
    });

    it('addEvent calls api and updates state', async () => {
        const newEv = { id: 101, title: 'E2' };
        api.createSocietyEvent.mockResolvedValue(newEv);
        const { result } = renderHook(() => useSocietyEvents(mockId, setSociety, fetchSociety));
        
        await act(async () => {
            const res = await result.current.addEvent({ title: 'E2' });
            expect(res).toEqual(newEv);
        });
        expect(api.createSocietyEvent).toHaveBeenCalledWith(mockId, expect.any(Object), false);
        expect(mockSoc.events).toHaveLength(2);
    });

    it('updateEvent calls api and updates state', async () => {
        const updatedEv = { id: 100, title: 'E1-Up' };
        api.updateSocietyEvent.mockResolvedValue(updatedEv);
        const { result } = renderHook(() => useSocietyEvents(mockId, setSociety, fetchSociety));
        
        await act(async () => {
            await result.current.updateEvent(100, { title: 'E1-Up' });
        });
        expect(api.updateSocietyEvent).toHaveBeenCalledWith(mockId, 100, expect.any(Object), false);
        expect(mockSoc.events[0].title).toBe('E1-Up');
    });

    it('deleteEvent calls api and updates state', async () => {
        api.deleteSocietyEvent.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyEvents(mockId, setSociety, fetchSociety));
        
        await act(async () => {
            await result.current.deleteEvent(100);
        });
        expect(api.deleteSocietyEvent).toHaveBeenCalledWith(mockId, 100, false);
        expect(mockSoc.events).toHaveLength(0);
    });

    it('addException calls api and fetchSociety', async () => {
        api.addExceptionDate.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyEvents(mockId, setSociety, fetchSociety));
        
        await act(async () => {
            await result.current.addException(100, '2025-01-01');
        });
        expect(api.addExceptionDate).toHaveBeenCalledWith(mockId, 100, '2025-01-01', false);
        expect(fetchSociety).toHaveBeenCalled();
    });

    it('updateEvent coverage for non-matching id', async () => {
        const updatedEv = { id: 100, title: 'E1-Up' };
        api.updateSocietyEvent.mockResolvedValue(updatedEv);
        mockSoc = { id: 1, events: [{ id: 100, title: 'E1' }, { id: 101, title: 'E2' }] };
        const { result } = renderHook(() => useSocietyEvents(mockId, setSociety, fetchSociety));
        await act(async () => { await result.current.updateEvent(100, { title: 'E1-Up' }); });
        expect(mockSoc.events[1].title).toBe('E2'); // E2 remains unchanged
    });
});
