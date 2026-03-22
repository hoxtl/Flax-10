/**
 * Tests for useQuickActions - quick actions for external events.
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuickActions } from '../../../../components/Calendar/hooks/useQuickActions';

const mockLoadEvents = vi.fn();
const mockRefreshTags = vi.fn();
const mockNotify = vi.fn();
const mockUnsync = vi.fn().mockResolvedValue({});

vi.mock('../../../../context/TagContext', () => ({ useTags: () => ({ refreshTags: mockRefreshTags }) }));
vi.mock('../../../../components/Notifications/hooks/useNotify', () => ({ useNotify: () => mockNotify }));
vi.mock('../../../../components/Calendar/hooks/useCalendarEvents', () => ({ useCalendarEvents: () => ({ loadEvents: mockLoadEvents }) }));
vi.mock('../../../../api/social/societyApi', () => ({ unsyncCalendar: (...args) => mockUnsync(...args) }));
vi.mock('../../../../components/Calendar/utils/eventUtils', () => ({ getEventType: (e) => e?.module ? 'module' : e?.society_id ? 'society' : 'personal' }));

describe('useQuickActions', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns null for personal events', () => {
        const { result } = renderHook(() => useQuickActions({ id: 1 }));
        expect(result.current).toBeNull();
    });

    it('returns null for module events', () => {
        const { result } = renderHook(() => useQuickActions({ id: 1, module: 'CS101' }));
        expect(result.current).toBeNull();
    });

    it('returns Unsync action for society events', () => {
        const { result } = renderHook(() => useQuickActions({ id: 1, society_id: 5 }));
        expect(result.current.label).toBe('Unsync');
        expect(typeof result.current.onClick).toBe('function');
    });

    it('Unsync action calls unsyncCalendar and refreshes', async () => {
        const { result } = renderHook(() => useQuickActions({ id: 1, society_id: 5, society_name: 'Chess' }));
        await act(async () => result.current.onClick({ stopPropagation: vi.fn() }));
        expect(mockUnsync).toHaveBeenCalledWith(5);
        expect(mockRefreshTags).toHaveBeenCalled();
        expect(mockLoadEvents).toHaveBeenCalled();
        expect(mockNotify).toHaveBeenCalled();
    });
});
