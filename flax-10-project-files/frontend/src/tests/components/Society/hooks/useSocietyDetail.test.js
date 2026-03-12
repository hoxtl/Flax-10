import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocietyDetail, buildHandlers } from '../../../../components/Society/hooks/useSocietyDetail';
import * as api from '../../../../api/societyApi';
import { useTags } from '../../../../context/TagContext';
import { useConfirm } from '../../../../context/ConfirmContext';

vi.mock('../../../../api/societyApi');
vi.mock('../../../../context/TagContext');
vi.mock('../../../../context/ConfirmContext');

describe('useSocietyDetail Hooks Core', () => {
    const mockSoc = { id: 1, name: 'S', tags: [], announcements: [], events: [], member_count: 0, is_member: false };
    
    beforeEach(() => {
        vi.clearAllMocks();
        api.fetchSociety.mockResolvedValue({ ...mockSoc });
        useTags.mockReturnValue({ refreshTags: vi.fn() });
        useConfirm.mockReturnValue(vi.fn(() => Promise.resolve(true)));
    });

    it('loads and handles fetch error', async () => {
        const { result, rerender } = renderHook(({ id }) => useSocietyDetail(id), { initialProps: { id: 1 } });
        await act(async () => {});
        expect(api.fetchSociety).toHaveBeenCalledWith(1);
        api.fetchSociety.mockRejectedValue(new Error('fail'));
        rerender({ id: 2 });
        await act(async () => {});
        expect(result.current.error).toBe('fail');
    });

    it('updateSociety reloads', async () => {
        api.updateSociety.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyDetail(1));
        await act(async () => { await result.current.updateSociety({}); });
        expect(api.fetchSociety).toHaveBeenCalledTimes(2);
    });
});

describe('useSocietyDetail Tags', () => {
    const mockSoc = { id: 1, tags: [{ id: 10 }] };
    beforeEach(() => {
        vi.clearAllMocks();
        api.fetchSociety.mockResolvedValue({ ...mockSoc });
        useTags.mockReturnValue({ refreshTags: vi.fn() });
    });

    it('manages tags', async () => {
        api.createSocietyTag.mockResolvedValue({ id: 11 });
        api.updateSocietyTag.mockResolvedValue({ id: 11, name: 'Up' });
        api.deleteSocietyTag.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyDetail(1));
        await act(async () => {});
        await act(async () => { await result.current.addTag({ name: 'T' }); });
        expect(result.current.society.tags).toHaveLength(2);
        await act(async () => { await result.current.updateTag(11, { name: 'Up' }); });
        expect(result.current.society.tags.find(t => t.id === 11).name).toBe('Up');
        await act(async () => { await result.current.deleteTag(10); });
        expect(result.current.society.tags).toHaveLength(1);
    });
});

describe('useSocietyDetail Events', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.fetchSociety.mockResolvedValue({ id: 1, events: [] });
    });

    it('manages events', async () => {
        api.createSocietyEvent.mockResolvedValue({ id: 100 });
        api.updateSocietyEvent.mockResolvedValue({ id: 100, title: 'Up' });
        api.deleteSocietyEvent.mockResolvedValue({});
        api.addExceptionDate.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyDetail(1));
        await act(async () => {});
        await act(async () => { await result.current.addEvent({ title: 'E' }); });
        expect(result.current.society.events).toHaveLength(1);
        await act(async () => { await result.current.updateEvent(100, { title: 'Up' }); });
        expect(result.current.society.events[0].title).toBe('Up');
        await act(async () => { await result.current.deleteEvent(100); });
        expect(result.current.society.events).toHaveLength(0);
        await act(async () => { await result.current.addException(101, 'd'); });
        expect(api.addExceptionDate).toHaveBeenCalled();
    });
});

describe('useSocietyDetail Announcements & Membership', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.fetchSociety.mockResolvedValue({ id: 1, member_count: 0, announcements: [] });
        useConfirm.mockReturnValue(vi.fn(() => Promise.resolve(true)));
        useTags.mockReturnValue({ refreshTags: vi.fn() });
    });

    it('syncs announcements', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        api.createAnnouncement.mockResolvedValue({ id: 10 });
        api.createSocietyEvent.mockRejectedValue(new Error('fail'));
        const { result } = renderHook(() => useSocietyDetail(1));
        await act(async () => { await result.current.addAnnouncement({ title: 'A', addAsEvent: true }); });
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('membership actions', async () => {
        api.joinSociety.mockResolvedValue({});
        api.leaveSociety.mockResolvedValue({});
        api.requestRatification.mockResolvedValue({});
        api.publishChanges.mockResolvedValue({});
        api.deleteSociety.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyDetail(1));
        await act(async () => {});
        await act(async () => { await result.current.joinSociety(); });
        expect(result.current.society.is_member).toBe(true);
        await act(async () => { await result.current.leaveSociety(); });
        expect(result.current.society.is_member).toBe(false);
        await act(async () => { await result.current.requestRatification(); });
        await act(async () => { await result.current.publishChanges([]); });
        await act(async () => { await result.current.deleteSociety(1); });
    });
});

describe('useSocietyDetail Management', () => {
    it('manages members correctly', async () => {
        vi.clearAllMocks();
        api.fetchSociety.mockResolvedValue({ id: 1, member_count: 5 });
        api.fetchMembers.mockResolvedValue([{ user: 10 }]);
        api.updateMemberRole.mockResolvedValue({});
        api.addCollaborator.mockResolvedValue({ user: 11 });
        api.leaveSociety.mockResolvedValue({});
        
        const { result } = renderHook(() => useSocietyDetail(1));
        await act(async () => { await result.current.fetchMembers(); });
        expect(result.current.members).toHaveLength(1);
        await act(async () => { await result.current.updateMemberRole(10, 'editor'); });
        await act(async () => { await result.current.addCollaborator(11, 'editor'); });
        expect(result.current.society.member_count).toBe(6);
        await act(async () => { await result.current.removeMember(10); });
        expect(result.current.society.member_count).toBe(5);
    });
});

describe('useSocietyDetail Utils & Handlers', () => {
    it('utility cover branches', async () => {
        vi.clearAllMocks();
        api.fetchSociety.mockResolvedValue({ id: 1 });
        api.createSocietyEvent.mockResolvedValue({});
        const { result } = renderHook(() => useSocietyDetail(1));
        await act(async () => { 
            await result.current.addEvent({ date: '2025-01-01', tag: 'abc', recurrence: 'weekly', announcement: 1 }); 
        });
        expect(api.createSocietyEvent).toHaveBeenCalledWith(1, expect.objectContaining({ tag: null, recurrence: 'weekly', announcement: 1 }), false);
    });

    it('buildHandlers wraps exhaustive', () => {
        const data = {
            addAnnouncement: vi.fn(), updateAnnouncement: vi.fn(), deleteAnnouncement: vi.fn(),
            addEvent: vi.fn(), updateEvent: vi.fn(), deleteEvent: vi.fn(), addException: vi.fn(),
            society: { announcements: [{ id: 1, title: 'Ann' }] }
        };
        const tracker = { trackAnnouncement: vi.fn(), trackEvent: vi.fn() };
        const h = buildHandlers(data, true, tracker);
        h.addAnnouncement({ title: 'A' });
        h.updateAnnouncement(1, { title: 'U' });
        h.deleteAnnouncement(1);
        h.deleteAnnouncement(2);
        h.addEvent({ title: 'E' });
        h.updateEvent(1, { title: 'EU' });
        h.deleteEvent(1, 'T');
        h.addException(1, 'd');
        expect(tracker.trackAnnouncement).toHaveBeenCalledTimes(3);
        expect(tracker.trackEvent).toHaveBeenCalledTimes(3);
    });
});
