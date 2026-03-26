import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHomeData } from '../../pages/Homepage/hooks/useHomeData';

vi.mock('../../components/Calendar/utils/dateUtils', () => ({
    overlapsDay: vi.fn((start, end, date) => {
        // Simple overlap: just check the date matches
        return start.toDateString() === date.toDateString();
    }),
}));

vi.mock('../../context/CalendarContext', () => ({
    useCalendar: vi.fn(() => ({ events: [], allEvents: [] })),
}));

vi.mock('../../api/taskApi', () => ({
    fetchTasks: vi.fn(),
}));

vi.mock('../../api/eventApi', () => ({
    getEvents: vi.fn(),
}));

import { useCalendar } from '../../context/CalendarContext';
import { fetchTasks } from '../../api/taskApi';
import { getEvents } from '../../api/eventApi';

const today = new Date();
today.setHours(12, 0, 0, 0);

describe('useHomeData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchTasks.mockResolvedValue([]);
        getEvents.mockResolvedValue([]);
        useCalendar.mockReturnValue({ events: [], allEvents: [] });
    });

    it('starts with empty dayTasks', () => {
        const { result } = renderHook(() => useHomeData(today));
        expect(result.current.dayTasks).toEqual([]);
    });

    it('starts with empty dayEvents', () => {
        const { result } = renderHook(() => useHomeData(today));
        expect(result.current.dayEvents).toEqual([]);
    });

    it('loads tasks on mount', async () => {
        const tasks = [
            { id: 1, title: 'Task 1', completed: false, due_date: today.toISOString(), priority: 'high' },
        ];
        fetchTasks.mockResolvedValue(tasks);
        const { result } = renderHook(() => useHomeData(today));
        await waitFor(() => {
            expect(result.current.allTasks).toHaveLength(1);
        });
    });

    it('filters out completed tasks in dayTasks', async () => {
        const tasks = [
            { id: 1, title: 'Done', completed: true, due_date: today.toISOString(), priority: 'low' },
            { id: 2, title: 'Active', completed: false, due_date: today.toISOString(), priority: 'high' },
        ];
        fetchTasks.mockResolvedValue(tasks);
        const { result } = renderHook(() => useHomeData(today));
        await waitFor(() => {
            expect(result.current.dayTasks).toHaveLength(1);
            expect(result.current.dayTasks[0].title).toBe('Active');
        });
    });

    it('handles fetchTasks error gracefully', async () => {
        fetchTasks.mockRejectedValue(new Error('API error'));
        const { result } = renderHook(() => useHomeData(today));
        await waitFor(() => {
            expect(fetchTasks).toHaveBeenCalled();
        });
        expect(result.current.allTasks).toEqual([]);
    });

    it('handles getEvents error gracefully', async () => {
        getEvents.mockRejectedValue(new Error('Events error'));
        const { result } = renderHook(() => useHomeData(today));
        await waitFor(() => {
            expect(getEvents).toHaveBeenCalled();
        });
        // Should not throw, fallback to empty
        expect(result.current.dayEvents).toEqual([]);
    });

    it('removePendingTask removes task by id', async () => {
        const tasks = [
            { id: 1, title: 'Task 1', completed: false, due_date: today.toISOString(), priority: 'medium' },
            { id: 2, title: 'Task 2', completed: false, due_date: today.toISOString(), priority: 'low' },
        ];
        fetchTasks.mockResolvedValue(tasks);
        const { result } = renderHook(() => useHomeData(today));
        await waitFor(() => expect(result.current.allTasks).toHaveLength(2));
        act(() => {
            result.current.removePendingTask(1);
        });
        expect(result.current.allTasks).toHaveLength(1);
        expect(result.current.allTasks[0].id).toBe(2);
    });

    it('refetchTasks re-fetches tasks', async () => {
        fetchTasks.mockResolvedValue([]);
        const { result } = renderHook(() => useHomeData(today));
        await waitFor(() => expect(fetchTasks).toHaveBeenCalledTimes(1));
        const newTasks = [{ id: 3, title: 'New', completed: false, due_date: today.toISOString(), priority: 'medium' }];
        fetchTasks.mockResolvedValue(newTasks);
        await act(async () => { result.current.refetchTasks(); });
        await waitFor(() => expect(result.current.allTasks).toHaveLength(1));
    });

    it('uses calendarContext events when available', async () => {
        const calEvents = [
            { id: 1, start_time: today.toISOString(), end_time: today.toISOString(), title: 'Cal Event' },
        ];
        useCalendar.mockReturnValue({ events: calEvents, allEvents: calEvents });
        const { result } = renderHook(() => useHomeData(today));
        await waitFor(() => {
            expect(result.current.dayEvents.length).toBeGreaterThan(0);
        });
    });
});
