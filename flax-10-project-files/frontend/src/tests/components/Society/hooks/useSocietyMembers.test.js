import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocietyMembers } from '../../../../components/society/hooks/useSocietyMembers';
import * as api from '../../../../api/societyApi';

vi.mock('../../../../api/societyApi', () => ({
    fetchMembers: vi.fn(),
    updateMemberRole: vi.fn(),
    addCollaborator: vi.fn(),
    leaveSociety: vi.fn()
}));

describe('useSocietyMembers', () => {
    const mockId = 1;
    let mockSoc = { id: 1, member_count: 5 };
    let setSociety;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSoc = { id: 1, member_count: 5 };
        setSociety = vi.fn((updater) => {
            if (typeof updater === 'function') {
                mockSoc = updater(mockSoc);
            }
        });
    });

    it('fetchMembers and updateMemberRole coverage', async () => {
        const members = [{ user: 10, role: 'member' }];
        api.fetchMembers.mockResolvedValue(members);
        api.updateMemberRole.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyMembers(mockId, setSociety));
        
        await act(async () => { await result.current.fetchMembers(); });
        await act(async () => { await result.current.updateMemberRole(10, 'editor'); });
        
        expect(result.current.members[0].role).toBe('editor');
        expect(api.updateMemberRole).toHaveBeenCalledWith(mockId, 10, 'editor');
    });

    it('addCollaborator handles missing member_count', async () => {
        api.addCollaborator.mockResolvedValue({ user: 12 });
        mockSoc = { id: 1 }; // No member_count
        const { result } = renderHook(() => useSocietyMembers(mockId, setSociety));
        await act(async () => { await result.current.addCollaborator(12, 'editor'); });
        expect(mockSoc.member_count).toBe(1);
    });

    it('updateMemberRole coverage for non-matching id', async () => {
        api.fetchMembers.mockResolvedValue([{ user: 1 }, { user: 2 }]);
        api.updateMemberRole.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyMembers(mockId, setSociety));
        await act(async () => { await result.current.fetchMembers(); });
        await act(async () => { await result.current.updateMemberRole(1, 'editor'); });
        expect(result.current.members[1].user).toBe(2); // and role is still original
    });

    it('removeMember handles missing member_count', async () => {
        api.leaveSociety.mockResolvedValue({});
        mockSoc = { id: 1 }; // No member_count
        const { result } = renderHook(() => useSocietyMembers(mockId, setSociety));
        await act(async () => {
            api.fetchMembers.mockResolvedValue([{ user: 10 }]);
             await result.current.fetchMembers();
             await result.current.removeMember(10);
        });
        expect(mockSoc.member_count).toBe(0);
    });
});
