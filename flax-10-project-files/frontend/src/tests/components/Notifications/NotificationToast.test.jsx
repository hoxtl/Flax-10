import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationToast, showNextToast } from '../../../components/Notifications/NotificationToast';

const useNotificationsMock = vi.fn();
const playNotificationSoundMock = vi.fn();
const executeNotificationActionMock = vi.fn();
const parseNotificationActionMock = vi.fn(() => ({ type: 'OPEN' }));
const hasNotificationActionMock = vi.fn(() => false);

vi.mock('../../../context/NotificationContext', () => ({
  useNotifications: () => useNotificationsMock(),
}));

vi.mock('../../../components/Notifications/utils/notificationSound', () => ({
  playNotificationSound: () => playNotificationSoundMock(),
}));

vi.mock('../../../components/Notifications/utils/notificationAction', () => ({
  executeNotificationAction: (...args) => executeNotificationActionMock(...args),
  parseNotificationAction: (...args) => parseNotificationActionMock(...args),
  hasNotificationAction: (...args) => hasNotificationActionMock(...args),
}));

const oldNotification = { id: 1, title: 'Old', message: 'Existing' };
const newNotification = { id: 2, title: 'New', message: 'Incoming' };

describe('NotificationToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders nothing while loading', () => {
    useNotificationsMock.mockReturnValue({ notifications: [], loading: true });

    const { container } = render(<NotificationToast />);

    expect(container.firstChild).toBeNull();
  });

  it('does not show already-existing notifications on first load', () => {
    useNotificationsMock.mockReturnValue({ notifications: [oldNotification], loading: false });

    const { container } = render(<NotificationToast />);

    expect(container.firstChild).toBeNull();
    expect(playNotificationSoundMock).not.toHaveBeenCalled();
  });

  it('shows a new notification and auto-dismisses it', () => {
    let state = { notifications: [oldNotification], loading: false };
    useNotificationsMock.mockImplementation(() => state);

    const { rerender, container } = render(<NotificationToast />);
    expect(container.firstChild).toBeNull();

    state = { notifications: [oldNotification, newNotification], loading: false };
    act(() => {
      rerender(<NotificationToast />);
    });

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Incoming')).toBeInTheDocument();
    expect(playNotificationSoundMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(3200);
      vi.runAllTimers();
      rerender(<NotificationToast />);
    });

    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('executes parsed action on clickable toast click', () => {
    hasNotificationActionMock.mockReturnValue(true);

    let state = { notifications: [oldNotification], loading: false };
    useNotificationsMock.mockImplementation(() => state);

    const { rerender } = render(<NotificationToast />);
    state = { notifications: [oldNotification, newNotification], loading: false };
    act(() => {
      rerender(<NotificationToast />);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(parseNotificationActionMock).toHaveBeenCalledWith(newNotification);
    expect(executeNotificationActionMock).toHaveBeenCalledWith({ type: 'OPEN' });
  });

  it('uses success styling for done notifications', () => {
    let state = { notifications: [oldNotification], loading: false };
    useNotificationsMock.mockImplementation(() => state);

    const { rerender } = render(<NotificationToast />);
    state = { notifications: [oldNotification, { id: 9, title: '✓ Done', message: 'Saved.' }], loading: false };
    act(() => {
      rerender(<NotificationToast />);
    });

    expect(document.querySelector('[class*="success"]')).toBeTruthy();
  });

  it('queues multiple new notifications and shows the next toast after timeout', () => {
    const newerNotification = { id: 3, title: 'Newest', message: 'Queued' };
    let state = { notifications: [oldNotification], loading: false };
    useNotificationsMock.mockImplementation(() => state);

    const { rerender } = render(<NotificationToast />);
    state = { notifications: [oldNotification, newNotification, newerNotification], loading: false };
    rerender(<NotificationToast />);

    expect(screen.getByText('New')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3200);
      vi.runAllTimers();
      rerender(<NotificationToast />);
    });

    expect(screen.getByText('Newest')).toBeInTheDocument();
    expect(playNotificationSoundMock).toHaveBeenCalledTimes(2);
  });

  it('does not execute action for non-clickable toast', () => {
    hasNotificationActionMock.mockReturnValue(false);

    let state = { notifications: [oldNotification], loading: false };
    useNotificationsMock.mockImplementation(() => state);

    const { rerender } = render(<NotificationToast />);
    state = { notifications: [oldNotification, newNotification], loading: false };
    act(() => {
      rerender(<NotificationToast />);
    });

    fireEvent.click(screen.getByText('New'));

    expect(parseNotificationActionMock).not.toHaveBeenCalled();
    expect(executeNotificationActionMock).not.toHaveBeenCalled();
  });

  it('showNextToast handles empty queue and timeout updater branches', () => {
    const setCurrentToast = vi.fn();

    showNextToast({ current: [] }, setCurrentToast);
    expect(setCurrentToast).toHaveBeenCalledWith(null);

    const queueRef = { current: [{ id: 4, title: 'x', message: 'y' }] };
    setCurrentToast.mockClear();
    showNextToast(queueRef, setCurrentToast);
    vi.advanceTimersByTime(3000);

    const updater = setCurrentToast.mock.calls[1][0];
    expect(updater({ id: 4 })).toBeNull();
    expect(updater(null)).toBeNull();
  });
});
