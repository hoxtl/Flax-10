import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SleepSchedulePanel } from '../../../components/Settings/SleepSchedulePanel';

vi.mock('../../../api/userService', () => ({
    getUserSettings: vi.fn(),
}));

vi.mock('../../../pages/Tasks/components/DateTimePicker', () => ({
    default: ({ value, onChange, placeholder }) => (
        <input
            data-testid={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    ),
}));

import { getUserSettings } from '../../../api/userService';

describe('SleepSchedulePanel', () => {
    beforeEach(() => {
        getUserSettings.mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' });
    });

    it('shows loading initially', () => {
        getUserSettings.mockReturnValueOnce(new Promise(() => {}));
        render(<SleepSchedulePanel onSave={vi.fn()} isSaving={false} />);
        expect(screen.getByLabelText('Loading sleep schedule')).toBeTruthy();
    });

    it('renders sleep schedule form after loading', async () => {
        render(<SleepSchedulePanel onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText('Sleep Schedule')).toBeTruthy();
        });
    });

    it('renders Bedtime and Wake up labels', async () => {
        render(<SleepSchedulePanel onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText('Bedtime')).toBeTruthy();
            expect(screen.getByText('Wake up')).toBeTruthy();
        });
    });

    it('shows sleep duration', async () => {
        render(<SleepSchedulePanel onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText('8h')).toBeTruthy();
        });
    });

    it('shows sleep duration in minutes', async () => {
        render(<SleepSchedulePanel onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText('480 minutes total')).toBeTruthy();
        });
    });

    it('calculates duration across midnight', async () => {
        getUserSettings.mockResolvedValueOnce({ sleep_time: '23:00:00', wake_time: '06:30:00' });
        render(<SleepSchedulePanel onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText('7h 30m')).toBeTruthy();
        });
    });

    it('calls onSave with sleep and wake times on submit', async () => {
        const onSave = vi.fn().mockResolvedValue();
        const { container } = render(<SleepSchedulePanel onSave={onSave} isSaving={false} />);
        await waitFor(() => screen.getByText('Sleep Schedule'));
        fireEvent.submit(container.querySelector('form'));
        expect(onSave).toHaveBeenCalledWith({ sleep_time: '23:00', wake_time: '07:00' });
    });

    it('renders Save button', async () => {
        render(<SleepSchedulePanel onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
        });
    });

    it('uses defaults when getUserSettings returns no times', async () => {
        getUserSettings.mockResolvedValueOnce({});
        render(<SleepSchedulePanel onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText('Sleep Schedule')).toBeTruthy();
        });
    });
});
