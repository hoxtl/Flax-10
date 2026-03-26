import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReminderField } from '../../../../../components/Calendar/event_modal/components/ReminderField';
import { CustomReminderInput, PermissionStatus } from '../../../../../components/Calendar/event_modal/components/ReminderFieldParts';

function stubNotification(permission = 'granted', requestPermission = vi.fn().mockResolvedValue(permission)) {
    vi.stubGlobal('Notification', {
        requestPermission,
        permission,
    });
    return requestPermission;
}

function restoreNotificationGlobals() {
    vi.unstubAllGlobals();
}

function renderPermissionStatusWithNotification(permission, requestPermission) {
    const stubbedRequestPermission = stubNotification(permission, requestPermission);
    render(<PermissionStatus />);
    return stubbedRequestPermission;
}

describe('ReminderField', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        stubNotification();
    });

    it('should render with no reminders', () => {
        render(<ReminderField value={[]} onChange={mockOnChange} />);
        expect(screen.getByText('No reminders')).toBeInTheDocument();
    });

    it('treats non-array reminder values as empty', () => {
        render(<ReminderField value={null} onChange={mockOnChange} />);
        expect(screen.getByText('No reminders')).toBeInTheDocument();
    });

    it('should render with one reminder', () => {
        render(<ReminderField value={[5]} onChange={mockOnChange} />);
        expect(screen.getByText('5 min before')).toBeInTheDocument();
    });

    it('formats zero-minute reminders as the event start time', () => {
        render(<ReminderField value={[0]} onChange={mockOnChange} />);
        expect(screen.getByText('At time of event')).toBeInTheDocument();
    });

    it('should render with multiple reminders', () => {
        render(<ReminderField value={[5, 10]} onChange={mockOnChange} />);
        expect(screen.getByText('2 reminders')).toBeInTheDocument();
    });

    it('should open dropdown on click', () => {
        render(<ReminderField value={[]} onChange={mockOnChange} />);
        fireEvent.click(screen.getByText('No reminders'));
        expect(screen.getByText('At time of event')).toBeInTheDocument();
    });

    it('should call onChange when toggling reminder', () => {
        render(<ReminderField value={[]} onChange={mockOnChange} />);
        fireEvent.click(screen.getByText('No reminders'));
        fireEvent.click(screen.getByText('5 min before'));
        expect(mockOnChange).toHaveBeenCalledWith([5]);
    });

    it('should sort reminders when adding', () => {
        render(<ReminderField value={[10]} onChange={mockOnChange} />);
        fireEvent.click(screen.getByText('10 min before'));
        fireEvent.click(screen.getAllByText('5 min before')[0]);
        expect(mockOnChange).toHaveBeenCalledWith([5, 10]);
    });

    it('should call onChange when removing reminder', () => {
        render(<ReminderField value={[5]} onChange={mockOnChange} />);
        fireEvent.click(screen.getByText('5 min before'));
        const allCheckboxes = screen.getAllByRole('checkbox');
        const checkbox = allCheckboxes.find(c => c.checked);
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);
        expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('should add custom reminder', () => {
        render(<ReminderField value={[]} onChange={mockOnChange} />);
        fireEvent.click(screen.getByText('No reminders'));
        const input = screen.getByPlaceholderText('Custom (min)');
        fireEvent.change(input, { target: { value: '20' } });
        fireEvent.click(screen.getByText('Add'));
        expect(mockOnChange).toHaveBeenCalledWith([20]);
    });

    it('should not add invalid custom reminder', () => {
        render(<ReminderField value={[]} onChange={mockOnChange} />);
        fireEvent.click(screen.getByText('No reminders'));
        const input = screen.getByPlaceholderText('Custom (min)');
        fireEvent.change(input, { target: { value: '-5' } });
        fireEvent.click(screen.getByText('Add'));
        expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should clean up event listener on unmount', () => {
        const removeSpy = vi.spyOn(document, 'removeEventListener');
        const { unmount } = render(<ReminderField value={[]} onChange={mockOnChange} />);
        unmount();
        expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });

    it('should format hours and days correctly', () => {
        render(<ReminderField value={[120, 2880]} onChange={mockOnChange} />); 
        expect(screen.getByText('2 reminders')).toBeInTheDocument();

        fireEvent.click(screen.getByText('2 reminders')); // Open dropdown
        expect(screen.getByText('2 hr before')).toBeInTheDocument();
        expect(screen.getByText('2 day before')).toBeInTheDocument();
    });

    it('should request permission on toggle if default', async () => {
        const requestPermission = stubNotification('default');
        render(<ReminderField value={[]} onChange={mockOnChange} />);
        fireEvent.click(screen.getByText('No reminders'));
        const checkbox = screen.getByText('5 min before');
        fireEvent.click(checkbox);
        expect(requestPermission).toHaveBeenCalled();
        restoreNotificationGlobals();
    });

    it('renders denied permission status', () => {
        renderPermissionStatusWithNotification('denied', vi.fn());
        expect(screen.getByText('Notifications blocked')).toBeInTheDocument();
        restoreNotificationGlobals();
    });

    it('requests permission from the enable button and updates the status', async () => {
        const requestPermission = renderPermissionStatusWithNotification('default', vi.fn().mockResolvedValue('granted'));
        fireEvent.click(screen.getByRole('button', { name: 'Enable notifications' }));

        await waitFor(() => expect(screen.getByText('Notifications enabled')).toBeInTheDocument());
        expect(requestPermission).toHaveBeenCalled();

        restoreNotificationGlobals();
    });

    it('shows not supported when the Notification API is unavailable', () => {
        const originalWindowNotification = Object.getOwnPropertyDescriptor(window, 'Notification');
        const originalGlobalNotification = Object.getOwnPropertyDescriptor(globalThis, 'Notification');

        delete window.Notification;
        delete globalThis.Notification;

        render(<PermissionStatus />);
        expect(screen.getByText('Not supported')).toBeInTheDocument();

        if (originalWindowNotification) {
            Object.defineProperty(window, 'Notification', originalWindowNotification);
        }
        if (originalGlobalNotification) {
            Object.defineProperty(globalThis, 'Notification', originalGlobalNotification);
        }
    });

    it('uses the Enter shortcut for custom reminders and ignores duplicates', () => {
        const onChange = vi.fn();
        render(<CustomReminderInput selected={[20]} onChange={onChange} />);

        const input = screen.getByPlaceholderText('Custom (min)');
        fireEvent.change(input, { target: { value: '20' } });
        fireEvent.keyDown(input, { key: 'Enter', preventDefault: vi.fn() });
        expect(onChange).not.toHaveBeenCalled();

        fireEvent.change(input, { target: { value: '25' } });
        fireEvent.keyDown(input, { key: 'Enter', preventDefault: vi.fn() });
        expect(onChange).toHaveBeenCalledWith([20, 25]);
    });
});
