import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useManualScheduleForm } from '../../../components/Schedules/manual/useManualScheduleForm';

const loadMock = vi.fn();
const useToastMock = vi.fn();

vi.mock('../../../components/Schedules/manual/loadScheduleTaggedEvents', () => ({
    loadScheduleTaggedEvents: (...args) => loadMock(...args),
}));

vi.mock('../../../context/ToastContext', () => ({
    useToast: () => useToastMock,
}));

describe('useManualScheduleForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        loadMock.mockImplementation(async (setEvents, setSelected) => {
            setEvents([
                { id: 1, title: 'Lecture A', tag_name: 'schedule' },
                { id: 2, title: 'Lab B', tag_name: 'schedule' },
            ]);
            setSelected([1, 2]);
        });
    });

    it('initialises with empty title and event search', () => {
        const { result } = renderHook(() => useManualScheduleForm());
        expect(result.current.title).toBe('');
        expect(result.current.eventSearch).toBe('');
    });

    it('loads schedule-tagged events on mount', async () => {
        const { result } = renderHook(() => useManualScheduleForm());
        await waitFor(() => expect(result.current.events).toHaveLength(2));
        expect(result.current.selected).toEqual([1, 2]);
    });

    it('returns all events as filteredEvents when search is empty', async () => {
        const { result } = renderHook(() => useManualScheduleForm());
        await waitFor(() => expect(result.current.filteredEvents).toHaveLength(2));
    });

    it('filters filteredEvents by eventSearch', async () => {
        const { result } = renderHook(() => useManualScheduleForm());
        await waitFor(() => expect(result.current.events).toHaveLength(2));
        act(() => {
            result.current.setEventSearch('lab');
        });
        expect(result.current.filteredEvents).toHaveLength(1);
        expect(result.current.filteredEvents[0].title).toBe('Lab B');
    });

    it('toggles selection – removes selected id', async () => {
        const { result } = renderHook(() => useManualScheduleForm());
        await waitFor(() => expect(result.current.selected).toEqual([1, 2]));
        act(() => { result.current.toggle(1); });
        expect(result.current.selected).toEqual([2]);
    });

    it('toggles selection – adds unselected id', async () => {
        const { result } = renderHook(() => useManualScheduleForm());
        await waitFor(() => expect(result.current.selected).toEqual([1, 2]));
        act(() => { result.current.selected; });
        act(() => { result.current.setSelected([1]); });
        act(() => { result.current.toggle(2); });
        expect(result.current.selected).toEqual([1, 2]);
    });

    it('exposes showToast from context', () => {
        const { result } = renderHook(() => useManualScheduleForm());
        expect(result.current.showToast).toBe(useToastMock);
    });

    it('exposes setTitle and setEventSearch setters', () => {
        const { result } = renderHook(() => useManualScheduleForm());
        act(() => { result.current.setTitle('New Title'); });
        expect(result.current.title).toBe('New Title');
        act(() => { result.current.setEventSearch('chemistry'); });
        expect(result.current.eventSearch).toBe('chemistry');
    });
});
