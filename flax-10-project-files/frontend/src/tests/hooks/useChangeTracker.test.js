import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChangeTracker } from '../../components/society/hooks/useChangeTracker';

describe('useChangeTracker', () => {
    it('initializes with empty changes', () => {
        const { result } = renderHook(() => useChangeTracker());
        expect(result.current.hasChanges()).toBe(false);
    });

    it('trackEvent adds to eventsAdded list', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => {
            result.current.trackEvent('Added', 'Summer Ball');
        });
        expect(result.current.hasChanges()).toBe(true);
        const summary = result.current.getChangeSummary();
        expect(summary.events_added).toContain('Summer Ball');
    });

    it('trackEvent adds to eventsUpdated list', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => {
            result.current.trackEvent('Updated', 'Chess Tournament');
        });
        const summary = result.current.getChangeSummary();
        expect(summary.events_updated).toContain('Chess Tournament');
    });

    it('trackAnnouncement adds to announcementsAdded list', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => {
            result.current.trackAnnouncement('Added', 'New announcement');
        });
        const summary = result.current.getChangeSummary();
        expect(summary.announcements_added).toContain('New announcement');
    });

    it('resetChanges clears all changes', () => {
        const { result } = renderHook(() => useChangeTracker());
        act(() => {
            result.current.trackEvent('Added', 'Event');
            result.current.resetChanges();
        });
        expect(result.current.hasChanges()).toBe(false);
    });

    it('getChangeSummary returns all change categories', () => {
        const { result } = renderHook(() => useChangeTracker());
        const summary = result.current.getChangeSummary();
        expect(summary).toHaveProperty('events_added');
        expect(summary).toHaveProperty('events_updated');
        expect(summary).toHaveProperty('events_deleted');
        expect(summary).toHaveProperty('announcements_added');
        expect(summary).toHaveProperty('announcements_updated');
        expect(summary).toHaveProperty('announcements_deleted');
    });
});
