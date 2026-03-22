import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScheduleManagerDialog } from '../../../../../components/Calendar/header/ScheduleManager/ScheduleManagerDialog';

vi.mock('../../../../../api/scheduleApi', () => ({
    getSchedules: vi.fn(),
    renameSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
}));

vi.mock('../../../../../context/ToastContext', () => ({
    useToast: vi.fn(() => vi.fn()),
}));

vi.mock('../../../../../components/common/StandardModal/StandardModal', () => ({
    default: ({ children, title, onClose }) => (
        <div data-testid="modal">
            <h1>{title}</h1>
            <button onClick={onClose}>Close</button>
            {children}
        </div>
    ),
}));

vi.mock('../../../../../components/common/HoldConfirmModal/HoldConfirmModal', () => ({
    default: ({ onConfirm, onCancel }) => (
        <div data-testid="confirm-modal">
            <button onClick={onConfirm} data-testid="confirm">Confirm</button>
            <button onClick={onCancel} data-testid="cancel">Cancel</button>
        </div>
    ),
}));

vi.mock('../../../../../components/common/PrimaryButton/PrimaryButton', () => ({
    default: ({ children, onClick, disabled }) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
}));

vi.mock('../../../../../components/common/TextInput/TextInput', () => ({
    default: ({ value, onChange }) => (
        <input value={value} onChange={onChange} data-testid="input" />
    ),
}));

import { getSchedules, renameSchedule, deleteSchedule } from '../../../../../api/scheduleApi';
import { useToast } from '../../../../../context/ToastContext';

describe('ScheduleManagerDialog', () => {
    let mockToast;
    const mockSchedules = [
        { id: 1, title: 'Schedule 1', event_allocations: [{ id: 1 }] },
        { id: 2, title: 'Schedule 2', event_allocations: [] },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockToast = vi.fn();
        useToast.mockReturnValue(mockToast);
    });

    it('renders nothing when closed', () => {
        const { container } = render(<ScheduleManagerDialog open={false} onClose={vi.fn()} />);
        expect(container.firstChild).toBeNull();
    });

    it('shows loading state then schedules', async () => {
        getSchedules.mockResolvedValue(mockSchedules);
        render(<ScheduleManagerDialog open={true} onClose={vi.fn()} />);
        
        expect(screen.getByText('Loading schedules…')).toBeTruthy();
        
        await waitFor(() => {
            expect(screen.getByText('Schedule 1')).toBeTruthy();
            expect(screen.getByText('Schedule 2')).toBeTruthy();
        });
    });

    it('shows empty state with Auto Schedule button', async () => {
        getSchedules.mockResolvedValue([]);
        render(<ScheduleManagerDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('⚙️ Auto Schedule')).toBeTruthy();
        });
    });

    it('handles fetch error', async () => {
        getSchedules.mockRejectedValue(new Error('Fetch failed'));
        render(<ScheduleManagerDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith('Fetch failed', { variant: 'error' });
        });
    });

    it('opens quick-add on Auto Schedule click', async () => {
        getSchedules.mockResolvedValue([]);
        const onClose = vi.fn();
        const listener = vi.fn();
        window.addEventListener('quick-add:open', listener);

        render(<ScheduleManagerDialog open={true} onClose={onClose} />);

        await waitFor(() => fireEvent.click(screen.getByText('⚙️ Auto Schedule')));

        expect(listener).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
        window.removeEventListener('quick-add:open', listener);
    });

    it('enters and exits rename mode', async () => {
        getSchedules.mockResolvedValue(mockSchedules);
        render(<ScheduleManagerDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => fireEvent.click(screen.getAllByText('Rename')[0]));
        expect(screen.getByTestId('input')).toHaveValue('Schedule 1');

        fireEvent.click(screen.getByText('Cancel'));
        await waitFor(() => expect(screen.queryByTestId('input')).toBeNull());
    });

    it('validates and saves rename', async () => {
        getSchedules.mockResolvedValue(mockSchedules);
        renameSchedule.mockResolvedValue({ event_allocations: [] });
        render(<ScheduleManagerDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => fireEvent.click(screen.getAllByText('Rename')[0]));
        
        // Empty name
        fireEvent.change(screen.getByTestId('input'), { target: { value: '   ' } });
        fireEvent.click(screen.getByText('Save'));
        expect(mockToast).toHaveBeenCalledWith('Enter a name.', { variant: 'error' });

        // Valid name
        fireEvent.change(screen.getByTestId('input'), { target: { value: 'New Name' } });
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(renameSchedule).toHaveBeenCalledWith(1, 'New Name');
            expect(screen.getByText('New Name')).toBeTruthy();
        });
    });

    it('handles rename error', async () => {
        getSchedules.mockResolvedValue(mockSchedules);
        renameSchedule.mockRejectedValue(new Error('Rename failed'));
        render(<ScheduleManagerDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => fireEvent.click(screen.getAllByText('Rename')[0]));
        fireEvent.change(screen.getByTestId('input'), { target: { value: 'New' } });
        fireEvent.click(screen.getByText('Save'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith('Rename failed', { variant: 'error' });
        });
    });

    it('shows and cancels delete confirmation', async () => {
        getSchedules.mockResolvedValue(mockSchedules);
        render(<ScheduleManagerDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => fireEvent.click(screen.getAllByText('Remove')[0]));
        expect(screen.getByTestId('confirm-modal')).toBeTruthy();

        fireEvent.click(screen.getByTestId('cancel'));
        await waitFor(() => expect(screen.queryByTestId('confirm-modal')).toBeNull());
    });

    it('confirms and deletes schedule', async () => {
        getSchedules.mockResolvedValue(mockSchedules);
        deleteSchedule.mockResolvedValue({});
        render(<ScheduleManagerDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => fireEvent.click(screen.getAllByText('Remove')[0]));
        fireEvent.click(screen.getByTestId('confirm'));

        await waitFor(() => {
            expect(deleteSchedule).toHaveBeenCalledWith(1);
            expect(mockToast).toHaveBeenCalledWith('Schedule deleted.');
            expect(screen.queryByText('Schedule 1')).toBeNull();
        });
    });

    it('handles delete error', async () => {
        getSchedules.mockResolvedValue(mockSchedules);
        deleteSchedule.mockRejectedValue(new Error('Delete failed'));
        render(<ScheduleManagerDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => fireEvent.click(screen.getAllByText('Remove')[0]));
        fireEvent.click(screen.getByTestId('confirm'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith('Delete failed', { variant: 'error' });
        });
    });

    it('handles non-array API response', async () => {
        getSchedules.mockResolvedValue(null);
        render(<ScheduleManagerDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('⚙️ Auto Schedule')).toBeTruthy();
        });
    });
});