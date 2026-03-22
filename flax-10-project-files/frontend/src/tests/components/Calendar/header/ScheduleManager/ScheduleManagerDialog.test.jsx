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


});