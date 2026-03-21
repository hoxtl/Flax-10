import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
<<<<<<< HEAD
import { useSocietyCore } from '../../../../components/society/hooks/useSocietyCore';
=======
import { useSocietyCore } from '../../../../components/Society/hooks/useSocietyCore';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import * as api from '../../../../api/societyApi';

vi.mock('../../../../api/societyApi', () => ({
    fetchSociety: vi.fn(),
    updateSociety: vi.fn(),
    deleteSociety: vi.fn(),
    createSocietyTag: vi.fn(),
    updateSocietyTag: vi.fn(),
    deleteSocietyTag: vi.fn(),
    createSocietyEvent: vi.fn(),
    updateSocietyEvent: vi.fn(),
    deleteSocietyEvent: vi.fn(),
    addExceptionDate: vi.fn(),
    createAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    fetchMembers: vi.fn(),
    updateMemberRole: vi.fn(),
    addCollaborator: vi.fn(),
    joinSociety: vi.fn(),
    leaveSociety: vi.fn(),
    requestRatification: vi.fn(),
    publishChanges: vi.fn(),
    toggleSubscription: vi.fn()
}));

describe('useSocietyCore', () => {
    const mockId = 1;
    const mockData = { id: 1, name: 'S' };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches society on mount', async () => {
        api.fetchSociety.mockResolvedValue(mockData);
        const { result } = renderHook(() => useSocietyCore(mockId));
        expect(result.current.loading).toBe(true);
        await act(async () => {});
        expect(api.fetchSociety).toHaveBeenCalledWith(mockId);
        expect(result.current.society).toEqual(mockData);
        expect(result.current.loading).toBe(false);
    });

    it('handles fetch error', async () => {
        api.fetchSociety.mockRejectedValue(new Error('fail'));
        const { result } = renderHook(() => useSocietyCore(mockId));
        await act(async () => {});
        expect(result.current.error).toBe('fail');
    });

    it('updateSociety calls api and refreshes', async () => {
        api.fetchSociety.mockResolvedValue(mockData);
        const { result } = renderHook(() => useSocietyCore(mockId));
        await act(async () => {});
        
        api.updateSociety.mockResolvedValue({});
        await act(async () => { await result.current.updateSociety({ name: 'N' }); });
        expect(api.updateSociety).toHaveBeenCalledWith(mockId, { name: 'N' });
        expect(api.fetchSociety).toHaveBeenCalledTimes(2);
    });

    it('updateSociety handles error', async () => {
        api.fetchSociety.mockResolvedValue(mockData);
        const { result } = renderHook(() => useSocietyCore(mockId));
        await act(async () => {});
        
        api.updateSociety.mockRejectedValue(new Error('up fail'));
        await act(async () => { await result.current.updateSociety({}); });
        expect(result.current.error).toBe('up fail');
    });

    it('deleteSociety calls api', async () => {
        const { result } = renderHook(() => useSocietyCore(mockId));
        api.deleteSociety.mockResolvedValue({});
        await act(async () => { await result.current.deleteSociety(); });
        expect(api.deleteSociety).toHaveBeenCalledWith(mockId);
    });

    it('deleteSociety handles error', async () => {
        const { result } = renderHook(() => useSocietyCore(mockId));
        api.deleteSociety.mockRejectedValue(new Error('del fail'));
        await act(async () => { await result.current.deleteSociety(); });
        expect(result.current.error).toBe('del fail');
    });

    it('does not fetch if id is missing', () => {
        renderHook(() => useSocietyCore(null));
        expect(api.fetchSociety).not.toHaveBeenCalled();
    });

    it('updateLocalSociety updates state without api call', async () => {
        api.fetchSociety.mockResolvedValue({ id: 1, name: 'S' });
        const { result } = renderHook(() => useSocietyCore(mockId));
        await act(async () => {}); 

        await act(async () => {
            result.current.updateLocalSociety({ name: 'Local' });
        });
        expect(result.current.society.name).toBe('Local');
        expect(api.updateSociety).not.toHaveBeenCalled();
    });
});
