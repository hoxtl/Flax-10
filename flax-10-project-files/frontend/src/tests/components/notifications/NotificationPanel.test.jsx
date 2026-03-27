import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/notifications/NotificationPanel.test.jsx
import { NotificationPanel } from '../../../components/notifications/components/NotificationPanel';
=======
import { NotificationPanel } from '../../../components/notifications/NotificationPanel';
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Notifications/NotificationPanel.test.jsx

const useNotificationsMock = vi.fn();
const executeNotificationActionMock = vi.fn();
const parseNotificationActionMock = vi.fn(() => ({ type: 'NAVIGATE' }));
const hasNotificationActionMock = vi.fn(() => false);

vi.mock('../../../context/NotificationContext', () => ({
  useNotifications: () => useNotificationsMock(),
}));

vi.mock('../../../components/notifications/utils/notificationAction', () => ({
  executeNotificationAction: (...args) => executeNotificationActionMock(...args),
  parseNotificationAction: (...args) => parseNotificationActionMock(...args),
  hasNotificationAction: (...args) => hasNotificationActionMock(...args),
}));

const baseNotification = {
  id: 1,
  title: 'Reminder',
  message: 'Study now',
  read: false,
  created_at: '2026-03-09T10:05:00.000Z',
};

const getDefaultContext = () => ({
  isOpen: true,
  notifications: [baseNotification],
  closePanel: vi.fn(),
  markAllRead: vi.fn(),
  dismissNotification: vi.fn(),
  clearAll: vi.fn(),
});

describe('NotificationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasNotificationActionMock.mockReturnValue(false);
  });

  it('renders nothing when panel is closed', () => {
    useNotificationsMock.mockReturnValue({ ...getDefaultContext(), isOpen: false });

    const { container } = render(<NotificationPanel />);

    expect(container.firstChild).toBeNull();
  });

  it('renders empty state when there are no notifications', () => {
    useNotificationsMock.mockReturnValue({ ...getDefaultContext(), notifications: [] });

    render(<NotificationPanel />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('No notifications')).toBeInTheDocument();
    expect(document.querySelector('.action-menu-btn')).toBeNull();
  });

  it('handles header menu actions', () => {
    const context = getDefaultContext();
    useNotificationsMock.mockReturnValue(context);

    render(<NotificationPanel />);

    const menuTrigger = document.querySelector('.action-menu-btn');
    fireEvent.click(menuTrigger);

    fireEvent.click(screen.getByText('Mark all read'));
    expect(context.markAllRead).toHaveBeenCalledTimes(1);

    fireEvent.click(menuTrigger);
    fireEvent.click(screen.getByText('Clear all'));
    expect(context.clearAll).toHaveBeenCalledTimes(1);
  });

  it('closes panel on outside click', () => {
    const context = getDefaultContext();
    useNotificationsMock.mockReturnValue(context);

    render(<NotificationPanel />);
    fireEvent.mouseDown(document.body);

    expect(context.closePanel).toHaveBeenCalledTimes(1);
  });

  it('closes header dropdown when clicking outside the action menu', () => {
    useNotificationsMock.mockReturnValue(getDefaultContext());

    render(<NotificationPanel />);
    const menuTrigger = document.querySelector('.action-menu-btn');
    fireEvent.click(menuTrigger);
    expect(screen.getByText('Mark all read')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('heading', { name: 'Notifications' }));

    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
  });

  it('does not close panel on inside click', () => {
    const context = getDefaultContext();
    useNotificationsMock.mockReturnValue(context);

    const { container } = render(<NotificationPanel />);
    const panel = container.querySelector('.notification-panel');
    fireEvent.mouseDown(panel);

    expect(context.closePanel).not.toHaveBeenCalled();
  });

  it('dismisses notification when dismiss button is clicked', () => {
    const context = getDefaultContext();
    useNotificationsMock.mockReturnValue(context);

    render(<NotificationPanel />);

    fireEvent.click(screen.getByRole('button', { name: '×' }));

    expect(context.dismissNotification).toHaveBeenCalledWith(1);
    expect(context.closePanel).not.toHaveBeenCalled();
    expect(executeNotificationActionMock).not.toHaveBeenCalled();
  });

  it('executes action for clickable notifications', () => {
    const context = getDefaultContext();
    useNotificationsMock.mockReturnValue(context);
    hasNotificationActionMock.mockReturnValue(true);

    render(<NotificationPanel />);

    fireEvent.click(screen.getByText('Reminder'));

    expect(context.closePanel).toHaveBeenCalledTimes(1);
    expect(parseNotificationActionMock).toHaveBeenCalledWith(baseNotification);
    expect(executeNotificationActionMock).toHaveBeenCalledWith({ type: 'NAVIGATE' });
  });

  it('does not execute action for non-clickable notifications', () => {
    const context = getDefaultContext();
    useNotificationsMock.mockReturnValue(context);
    hasNotificationActionMock.mockReturnValue(false);

    render(<NotificationPanel />);

    fireEvent.click(screen.getByText('Reminder'));

    expect(context.closePanel).not.toHaveBeenCalled();
    expect(parseNotificationActionMock).not.toHaveBeenCalled();
    expect(executeNotificationActionMock).not.toHaveBeenCalled();
  });

  it('renders read notifications and empty time when created_at is missing', () => {
    useNotificationsMock.mockReturnValue({
      ...getDefaultContext(),
      notifications: [{ ...baseNotification, read: true, created_at: null }],
    });

    const { container } = render(<NotificationPanel />);

    const item = container.querySelector('.notification-item');
    const time = container.querySelector('.notification-time');
    expect(item.className).not.toContain('unread');
    expect(time).toHaveTextContent('');
  });

  it('removes outside-click listener on unmount', () => {
    const context = getDefaultContext();
    useNotificationsMock.mockReturnValue(context);
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(<NotificationPanel />);
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    removeSpy.mockRestore();
  });
});
