import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChangeTracker } from '../../../../components/Society/hooks/useChangeTracker';

describe('useChangeTracker', () => {
    it('starts with no changes and hasChanges returns false', () => {
        const { result } = renderHook(() => useChangeTracker());
        expect(result.current.hasChanges()).toBe(false);
    });

    it('trackEvent adds event to the correct list', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => { result.current.trackEvent('Added', 'Event 1'); });
        expect(result.current.hasChanges()).toBe(true);
        expect(result.current.getChangeSummary().events_added).toContain('Event 1');
    });

    it('trackEvent tracks updated events', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => { result.current.trackEvent('Updated', 'Event 2'); });
        expect(result.current.getChangeSummary().events_updated).toContain('Event 2');
    });

    it('trackEvent tracks deleted events', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => { result.current.trackEvent('Deleted', 'Event 3'); });
        expect(result.current.getChangeSummary().events_deleted).toContain('Event 3');
    });

    it('trackAnnouncement adds to correct list', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => { result.current.trackAnnouncement('Added', 'Ann 1'); });
        expect(result.current.getChangeSummary().announcements_added).toContain('Ann 1');
    });

    it('trackAnnouncement tracks updated announcements', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => { result.current.trackAnnouncement('Updated', 'Ann 2'); });
        expect(result.current.getChangeSummary().announcements_updated).toContain('Ann 2');
    });

    it('trackAnnouncement tracks deleted announcements', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => { result.current.trackAnnouncement('Deleted', 'Ann 3'); });
        expect(result.current.getChangeSummary().announcements_deleted).toContain('Ann 3');
    });

    it('resetChanges clears all changes', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => { result.current.trackEvent('Added', 'E1'); });
        expect(result.current.hasChanges()).toBe(true);
        act(() => { result.current.resetChanges(); });
        expect(result.current.hasChanges()).toBe(false);
    });
});
