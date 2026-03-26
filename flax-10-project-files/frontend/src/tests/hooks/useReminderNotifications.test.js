import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useReminderNotifications } from '../../components/notifications/hooks/useReminderNotifications';

const mockAddNotification = vi.fn();
const mockEvents = [];

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

const invalidReminderEvents = [
  { id: 1, title: 'No Reminder', start_time: '2025-01-01T10:00:00', reminder_minutes: null },
  { id: 2, title: 'Invalid Reminder', start_time: '2025-01-01T10:00:00', reminder_minutes: -5 },
];

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
    const event = { id: 1, title: 'Meeting', start_time: '2024-03-15T10:05:00Z', reminder_minutes: [5] };
    mockEvents.push(event);
    renderHook(() => useReminderNotifications(mockEvents));
    act(() => { vi.advanceTimersByTime(60000); });
  });

  it('should trigger notification when passing reminder time', () => {
    vi.setSystemTime(new Date('2024-03-15T09:59:00Z'));
    const event = { id: 1, title: 'Meeting', start_time: '2024-03-15T10:05:00Z', reminder_minutes: [5] };
    mockEvents.push(event);
    renderHook(() => useReminderNotifications(mockEvents));
    act(() => { vi.advanceTimersByTime(120000); });
    expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Reminder: Meeting' }));
  });

  it('should not trigger duplicate notifications', () => {
    vi.setSystemTime(new Date('2024-03-15T09:59:00Z'));
    const event = { id: 1, title: 'Meeting', start_time: '2024-03-15T10:05:00Z', reminder_minutes: [5] };
    mockEvents.push(event);
    const { rerender } = renderHook(({ events }) => useReminderNotifications(events), { initialProps: { events: mockEvents } });
    act(() => vi.advanceTimersByTime(120000));
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
    mockAddNotification.mockClear();
    rerender({ events: mockEvents });
    act(() => vi.advanceTimersByTime(60000));
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('should handle multiple reminders for same event', () => {
    vi.setSystemTime(new Date('2024-03-15T08:59:00Z'));
    const event = { id: 1, title: 'Event', start_time: '2024-03-15T10:00:00Z', reminder_minutes: [60, 15] };
    mockEvents.push(event);
    renderHook(() => useReminderNotifications(mockEvents));
    act(() => vi.advanceTimersByTime(120000));
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
    mockAddNotification.mockClear();
    act(() => vi.advanceTimersByTime(45 * 60000));
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
  });

  it('should handle single value reminder_minutes (legacy format)', () => {
    vi.setSystemTime(new Date('2024-03-15T09:59:00Z'));
    const event = { id: 1, title: 'Event', start_time: '2024-03-15T10:05:00Z', reminder_minutes: 5 };
    mockEvents.push(event);
    renderHook(() => useReminderNotifications(mockEvents));
    act(() => vi.advanceTimersByTime(120000));
    expect(mockAddNotification).toHaveBeenCalledTimes(1);
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.setItem.mockImplementation(() => { throw new Error('QuotaExceeded'); });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.setSystemTime(new Date('2024-03-15T09:59:00Z'));
    const event = { id: 1, title: 'Event', start_time: '2024-03-15T10:05:00Z', reminder_minutes: [5] };
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
    const event = { id: 1, title: 'Event', start_time: '2024-03-15T10:05:00Z', reminder_minutes: [5] };
    mockEvents.push(event);
    renderHook(() => useReminderNotifications(mockEvents));
    act(() => vi.advanceTimersByTime(120000));
    expect(mockAddNotification).toHaveBeenCalled();
    localStorageMock.getItem.mockReset();
  });

  it('should ignore events with invalid reminder_minutes', () => {
    renderHook(() => useReminderNotifications(invalidReminderEvents));
    vi.setSystemTime(new Date('2025-01-01T10:00:00'));
    act(() => vi.advanceTimersByTime(10000));
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('should ignore events that do not have a start time', () => {
    vi.setSystemTime(new Date('2024-03-15T09:59:00Z'));
    mockEvents.push({ id: 3, title: 'No start', reminder_minutes: [5] });
    renderHook(() => useReminderNotifications(mockEvents));
    act(() => vi.advanceTimersByTime(120000));
    expect(mockAddNotification).not.toHaveBeenCalled();
  });

  it('should send a "Starting now!" message for zero-minute reminders and include descriptions', () => {
    vi.setSystemTime(new Date('2024-03-15T10:00:00Z'));
    mockEvents.push({
      id: 4,
      title: 'Standup',
      description: 'Bring blockers',
      start_time: '2024-03-15T10:00:00Z',
      reminder_minutes: [0],
    });
    renderHook(() => useReminderNotifications(mockEvents));
    act(() => vi.advanceTimersByTime(10000));
    expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Reminder: Standup',
      message: expect.stringContaining('Starting now!'),
    }));
    expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Bring blockers'),
    }));
  });
});
