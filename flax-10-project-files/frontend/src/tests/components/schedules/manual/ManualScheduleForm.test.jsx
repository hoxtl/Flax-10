import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualScheduleForm } from '../../../../components/schedules/manual/ManualScheduleForm';

const submitManualScheduleMock = vi.fn();
const useManualScheduleFormMock = vi.fn();

vi.mock('../../../../components/schedules/manual/submitManualSchedule', () => ({
    submitManualSchedule: (...args) => submitManualScheduleMock(...args),
}));

vi.mock('../../../../components/schedules/manual/useManualScheduleForm', () => ({
    useManualScheduleForm: () => useManualScheduleFormMock(),
}));

vi.mock('../../../../components/schedules/manual/ManualScheduleFields', () => ({
    ManualScheduleFields: ({ title }) => <div data-testid="fields">Fields:{title}</div>,
}));

vi.mock('../../../../components/schedules/manual/ManualScheduleEventList', () => ({
    ManualScheduleEventList: () => <div data-testid="event-list">EventList</div>,
}));

vi.mock('../../../../components/schedules/shared/scheduleFormStyles', () => ({
    default: { formWrap: 'formWrap', primaryBtn: 'primaryBtn' },
}));

const defaultFormState = {
    title: 'My Plan',
    setTitle: vi.fn(),
    eventSearch: '',
    setEventSearch: vi.fn(),
    events: [{ id: 1, title: 'Lecture' }],
    setEvents: vi.fn(),
    selected: [1],
    setSelected: vi.fn(),
    filteredEvents: [{ id: 1, title: 'Lecture' }],
    showToast: vi.fn(),
    toggle: vi.fn(),
};

describe('ManualScheduleForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useManualScheduleFormMock.mockReturnValue({ ...defaultFormState });
    });

    it('renders the Create Schedule button', () => {
        render(<ManualScheduleForm onDone={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Create Schedule' })).toBeInTheDocument();
    });

    it('renders ManualScheduleFields and ManualScheduleEventList', () => {
        render(<ManualScheduleForm onDone={vi.fn()} />);
        expect(screen.getByTestId('fields')).toBeInTheDocument();
        expect(screen.getByTestId('event-list')).toBeInTheDocument();
    });

    it('calls submitManualSchedule with form state and onDone when button is clicked', async () => {
        submitManualScheduleMock.mockResolvedValue(undefined);
        const onDone = vi.fn();
        render(<ManualScheduleForm onDone={onDone} />);
        fireEvent.click(screen.getByRole('button', { name: 'Create Schedule' }));
        await waitFor(() => expect(submitManualScheduleMock).toHaveBeenCalledWith(
            expect.objectContaining({ onDone })
        ));
    });

    it('calls showToast with error message when submitManualSchedule rejects', async () => {
        const showToast = vi.fn();
        useManualScheduleFormMock.mockReturnValue({ ...defaultFormState, showToast });
        submitManualScheduleMock.mockRejectedValue(new Error('Network error'));
        render(<ManualScheduleForm onDone={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Create Schedule' }));
        await waitFor(() =>
            expect(showToast).toHaveBeenCalledWith('Network error', { variant: 'error' })
        );
    });
});
