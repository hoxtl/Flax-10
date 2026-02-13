import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useReminderNotifications } from '../../hooks/useReminderNotifications';

// Mocks
const mockAddNotification = vi.fn();
const mockEvents = [];

// localStorage mock
const localStorageMock = createLocalStorageMock();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

function createLocalStorageMock() {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value; }),
        clear: vi.fn(() => { store = {}; }),
        removeItem: vi.fn((key) => { delete store[key]; }),
    };
}

vi.mock('../../context/CalendarContext', () => ({
    useCalendar: () => ({ events: mockEvents }),
}));

vi.mock('../../context/NotificationContext', () => ({
    useNotifications: () => ({ addNotification: mockAddNotification }),
}));

describe('useReminderNotifications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        mockEvents.length = 0;
        localStorageMock.clear();
        global.Notification = vi.fn();
        global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');
        global.Notification.permission = 'granted';
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should request notification permission on mount', () => {
        global.Notification.permission = 'default';
        renderHook(() => useReminderNotifications(mockEvents));
        expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    it('should trigger notification for due event', () => {
        const now = new Date('2024-03-15T10:00:00Z');
        vi.setSystemTime(now);
        const event = {
            id: 1,
            title: 'Meeting',
            start_time: '2024-03-15T10:05:00Z',
            reminder_minutes: [5], // 5 mins before
        };
        mockEvents.push(event);
        renderHook(() => useReminderNotifications(mockEvents));
        // Fast forward 1 minute to trigger check
        act(() => {
            vi.advanceTimersByTime(60000);
        });
    });

    it('should trigger notification when passing reminder time', () => {
        vi.setSystemTime(new Date('2024-03-15T09:59:00Z'));
        const event = {
            id: 1,
            title: 'Meeting',
            start_time: '2024-03-15T10:05:00Z',
            reminder_minutes: [5], // 10:00 reminder
        };
        mockEvents.push(event);

        renderHook(() => useReminderNotifications(mockEvents));

        // Advance 2 minutes to 10:01
        act(() => {
            vi.advanceTimersByTime(120000);
        });

        expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Reminder: Meeting',
        }));
    });

    it('should not trigger duplicate notifications', () => {
        vi.setSystemTime(new Date('2024-03-15T09:59:00Z'));
        const event = {
            id: 1, title: 'Meeting', start_time: '2024-03-15T10:05:00Z', reminder_minutes: [5]
        };
        mockEvents.push(event);

        const { rerender } = renderHook(({ events }) => useReminderNotifications(events), {
            initialProps: { events: mockEvents }
        });

        // Trigger once
        act(() => vi.advanceTimersByTime(120000));
        expect(mockAddNotification).toHaveBeenCalledTimes(1);
        mockAddNotification.mockClear();

        // Re-render (simulate update or interval)
        rerender({ events: mockEvents });
        act(() => vi.advanceTimersByTime(60000)); // 10:02

        // Should NOT trigger again because it's saved in localStorage
        expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('should handle multiple reminders for same event', () => {
        // Start at 8:59
        vi.setSystemTime(new Date('2024-03-15T08:59:00Z'));

        const event = {
            id: 1, title: 'Event', start_time: '2024-03-15T10:00:00Z',
            reminder_minutes: [60, 15] // 9:00 and 9:45
        };
        mockEvents.push(event);

        renderHook(() => useReminderNotifications(mockEvents));

        // Advance to 9:01
        act(() => vi.advanceTimersByTime(120000));
        expect(mockAddNotification).toHaveBeenCalledTimes(1); // 60 min reminder
        mockAddNotification.mockClear();

        // Advance to 9:46
        act(() => vi.advanceTimersByTime(45 * 60000));
        expect(mockAddNotification).toHaveBeenCalledTimes(1); // 15 min reminder
    });

    it('should handle single value reminder_minutes (legacy format)', () => {
        vi.setSystemTime(new Date('2024-03-15T09:59:00Z'));
        const event = {
            id: 1, title: 'Event', start_time: '2024-03-15T10:05:00Z',
            reminder_minutes: 5 // number, not array
        };
        mockEvents.push(event);

        renderHook(() => useReminderNotifications(mockEvents));

        act(() => vi.advanceTimersByTime(120000));
        expect(mockAddNotification).toHaveBeenCalledTimes(1);
    });

    it('should handle localStorage errors gracefully', () => {
        localStorageMock.setItem.mockImplementation(() => { throw new Error('QuotaExceeded'); });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        vi.setSystemTime(new Date('2024-03-15T09:59:00Z'));
        const event = {
            id: 1, title: 'Event', start_time: '2024-03-15T10:05:00Z', reminder_minutes: [5]
        };
        mockEvents.push(event);

        renderHook(() => useReminderNotifications(mockEvents));
        act(() => vi.advanceTimersByTime(120000));

        expect(consoleSpy).toHaveBeenCalledWith('Failed to save sent reminders', expect.any(Error));

        localStorageMock.setItem.mockReset();
        consoleSpy.mockRestore();
    });

    it('should handle corrupted localStorage gracefully', () => {
        localStorageMock.getItem.mockReturnValue('invalid-json');

        vi.setSystemTime(new Date('2024-03-15T09:59:00Z'));
        const event = {
            id: 1, title: 'Event', start_time: '2024-03-15T10:05:00Z', reminder_minutes: [5]
        };
        mockEvents.push(event);

        // Should default to empty set and notify at least once
        renderHook(() => useReminderNotifications(mockEvents));
        act(() => vi.advanceTimersByTime(120000));
        expect(mockAddNotification).toHaveBeenCalled();

        localStorageMock.getItem.mockReset();
    });

    it('should ignore events with invalid reminder_minutes', () => {
        const events = [
            // Null reminders
            {
                id: 1,
                title: 'No Reminder',
                start_time: '2025-01-01T10:00:00',
                reminder_minutes: null
            },
            // Negative reminders
            {
                id: 2,
                title: 'Invalid Reminder',
                start_time: '2025-01-01T10:00:00',
                reminder_minutes: -5
            }
        ];

        renderHook(() => useReminderNotifications(events));

        // Fast forward time. Even if due, no reminder should trigger because getReminders returns []
        // We need to set time near start_time
        vi.setSystemTime(new Date('2025-01-01T10:00:00'));
        act(() => vi.advanceTimersByTime(10000));

        expect(mockAddNotification).not.toHaveBeenCalled();
    });
});
