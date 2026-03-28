import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocietyMembership } from '../../../../components/society/hooks/useSocietyMembership';
import * as api from '../../../../api/societyApi';
import { useTags } from '../../../../context/TagContext';
import { useToast } from '../../../../context/ToastContext';

vi.mock('../../../../api/societyApi', () => ({
    joinSociety: vi.fn(),
    leaveSociety: vi.fn(),
    requestRatification: vi.fn(),
    publishChanges: vi.fn()
}));

vi.mock('../../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({ refreshTags: vi.fn() }))
}));

vi.mock('../../../../context/ToastContext', () => ({
    useToast: vi.fn()
}));

describe('useSocietyMembership', () => {
    const mockId = 1;
    let mockSoc = { id: 1, name: 'Chess Club', member_count: 5, is_member: false };
    let setSociety, refreshTags, showToast;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSoc = { id: 1, name: 'Chess Club', member_count: 5, is_member: false };
        setSociety = vi.fn((updater) => {
            if (typeof updater === 'function') {
                mockSoc = updater(mockSoc);
            }
        });
        refreshTags = vi.fn();
        useTags.mockReturnValue({ refreshTags });
        showToast = vi.fn();
        useToast.mockReturnValue(showToast);
    });

    it('joinSociety successfully', async () => {
        api.joinSociety.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyMembership(mockId, setSociety));
        
        await act(async () => { await result.current.joinSociety(); });
        expect(api.joinSociety).toHaveBeenCalledWith(mockId);
        expect(mockSoc.is_member).toBe(true);
        expect(mockSoc.member_count).toBe(6);
        expect(showToast).toHaveBeenCalledWith('Joined Chess Club');
    });

    it('joinSociety handles error and still updates state on later success', async () => {
        api.joinSociety.mockRejectedValue(new Error('join fail'));
        const { result } = renderHook(() => useSocietyMembership(mockId, setSociety));
        await act(async () => { await result.current.joinSociety(); });
        expect(api.joinSociety).toHaveBeenCalledWith(mockId);
        expect(mockSoc.is_member).toBe(false);
        expect(showToast).toHaveBeenCalledWith("Couldn't join this society.", { variant: "error" });

        api.joinSociety.mockResolvedValue({});
        showToast.mockClear();
        await act(async () => { await result.current.joinSociety(); });
        expect(mockSoc.is_member).toBe(true);
        expect(showToast).toHaveBeenCalledWith('Joined Chess Club');
    });

    it('leaveSociety successfully and error paths', async () => {
        api.leaveSociety.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyMembership(mockId, setSociety));
        
        await act(async () => { await result.current.leaveSociety(); });
        expect(api.leaveSociety).toHaveBeenCalledWith(mockId, 'me');
        expect(mockSoc.is_member).toBe(false);
        expect(mockSoc.member_count).toBe(4);
        expect(refreshTags).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith('Left Chess Club');

        api.leaveSociety.mockRejectedValue(new Error('leave fail'));
        showToast.mockClear();
        await act(async () => { await result.current.leaveSociety(); });
        expect(api.leaveSociety).toHaveBeenCalledWith(mockId, 'me');
        expect(showToast).toHaveBeenCalledWith("Couldn't leave this society.", { variant: "error" });

        // Missing member_count branch
        mockSoc = { id: 1, name: 'Chess Club', is_member: true }; // No member_count
        api.leaveSociety.mockResolvedValue({});
        await act(async () => { await result.current.leaveSociety(); });
        expect(mockSoc.member_count).toBe(0);
    });

    it('joinSociety missing member_count branch', async () => {
        mockSoc = { id: 1, name: 'Chess Club' }; // No member_count
        api.joinSociety.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyMembership(mockId, setSociety));
        await act(async () => { await result.current.joinSociety(); });
        expect(mockSoc.member_count).toBe(1);
    });

    it('requestRatification and publishChanges', async () => {
        api.requestRatification.mockResolvedValue({});
        api.publishChanges.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyMembership(mockId, setSociety));
        
        await act(async () => { await result.current.requestRatification(); });
        await act(async () => { await result.current.publishChanges([]); });
        expect(api.requestRatification).toHaveBeenCalledWith(mockId);
        expect(api.publishChanges).toHaveBeenCalledWith(mockId, []);
        expect(mockSoc.ratification_status).toBe('pending');
    });
});
