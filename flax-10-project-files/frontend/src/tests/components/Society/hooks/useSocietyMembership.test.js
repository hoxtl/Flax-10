import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocietyMembership } from '../../../../components/Society/hooks/useSocietyMembership';
import * as api from '../../../../api/social/societyApi';
import { useTags } from '../../../../context/TagContext';
import { useConfirm } from '../../../../context/ConfirmContext';

vi.mock('../../../../api/social/societyApi', () => ({
    joinSociety: vi.fn(),
    leaveSociety: vi.fn(),
    requestRatification: vi.fn(),
    publishChanges: vi.fn(),
    toggleSubscription: vi.fn()
}));

vi.mock('../../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({ refreshTags: vi.fn() }))
}));

vi.mock('../../../../context/ConfirmContext', () => ({
    useConfirm: vi.fn()
}));

describe('useSocietyMembership', () => {
    const mockId = 1;
    let mockSoc = { id: 1, member_count: 5, is_member: false };
    let setSociety, confirm, refreshTags;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSoc = { id: 1, member_count: 5, is_member: false };
        setSociety = vi.fn((updater) => {
            if (typeof updater === 'function') {
                mockSoc = updater(mockSoc);
            }
        });
        confirm = vi.fn().mockResolvedValue(true);
        useConfirm.mockReturnValue(confirm);
        refreshTags = vi.fn();
        useTags.mockReturnValue({ refreshTags });
    });

    it('joinSociety successfully', async () => {
        api.joinSociety.mockResolvedValue({});
        api.toggleSubscription.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyMembership(mockId, setSociety));
        
        await act(async () => { await result.current.joinSociety(); });
        expect(api.joinSociety).toHaveBeenCalledWith(mockId);
        expect(mockSoc.is_member).toBe(true);
        expect(mockSoc.member_count).toBe(6);
        expect(confirm).toHaveBeenCalled();
        expect(api.toggleSubscription).toHaveBeenCalledWith(mockId, true);
    });

    it('joinSociety handles error and subscription cancel/error', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        api.joinSociety.mockRejectedValue(new Error('join fail'));
        const { result } = renderHook(() => useSocietyMembership(mockId, setSociety));
        await act(async () => { await result.current.joinSociety(); });
        expect(spy).toHaveBeenCalledWith('Join failed:', expect.any(Error));

        api.joinSociety.mockResolvedValue({});
        confirm.mockResolvedValue(false);
        await act(async () => { await result.current.joinSociety(); });
        expect(api.toggleSubscription).not.toHaveBeenCalled();

        confirm.mockResolvedValue(true);
        api.toggleSubscription.mockRejectedValue(new Error('sub fail'));
        await act(async () => { await result.current.joinSociety(); });
        expect(spy).toHaveBeenCalledWith('Join failed:', expect.any(Error));
        
        spy.mockRestore();
    });

    it('leaveSociety successfully and error paths', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        api.leaveSociety.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyMembership(mockId, setSociety));
        
        await act(async () => { await result.current.leaveSociety(); });
        expect(api.leaveSociety).toHaveBeenCalledWith(mockId, 'me');
        expect(mockSoc.is_member).toBe(false);
        expect(mockSoc.member_count).toBe(4);
        expect(refreshTags).toHaveBeenCalled();

        api.leaveSociety.mockRejectedValue(new Error('leave fail'));
        await act(async () => { await result.current.leaveSociety(); });
        expect(spy).toHaveBeenCalledWith('Leave failed:', expect.any(Error));

        // Missing member_count branch
        mockSoc = { id: 1, is_member: true }; // No member_count
        api.leaveSociety.mockResolvedValue({});
        await act(async () => { await result.current.leaveSociety(); });
        expect(mockSoc.member_count).toBe(0);

        spy.mockRestore();
    });

    it('joinSociety missing member_count branch', async () => {
        mockSoc = { id: 1 }; // No member_count
        api.joinSociety.mockResolvedValue({});
        confirm.mockResolvedValue(false);
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
