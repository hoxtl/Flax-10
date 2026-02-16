import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEventForm } from '../../../../components/Calendar/EventModal/useEventForm';
import * as CalendarContextModule from '../../../../context/CalendarContext';
import * as EventActionsModule from '../../../../hooks/useCalendarEvents';
import * as FormUtilsModule from '../../../../utils/formUtils';

// Mock dependencies
const mockEvents = [];
const mockActions = { addEvent: vi.fn(), updateEvent: vi.fn(), deleteEvent: vi.fn() };
const mockInitialForm = {
    title: 'Form', description: '', tag: '', start_time: '', end_time: '',
    reminder: [], recurrence: { frequency: 'none' }, location: '', all_day: false
};

vi.mock('../../../../context/CalendarContext', async () => {
    const actual = await vi.importActual('../../../../context/CalendarContext');
    return {
        ...actual,
        useCalendar: () => ({ events: mockEvents }),
    };
});

vi.mock('../../../../hooks/useCalendarEvents', () => ({
    useEventActions: () => mockActions,
}));

vi.mock('../../../../utils/formUtils', () => ({
    getInitialForm: vi.fn(() => mockInitialForm),
    validateAndSubmit: vi.fn(),
    confirmDelete: vi.fn(),
}));

describe('useEventForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialise form with values', () => {
        const { result } = renderHook(() => useEventForm({ id: 1 }, vi.fn()));
        expect(result.current.form).toEqual(mockInitialForm);
        expect(result.current.isEditing).toBe(true);
    });

    it('should update form when event changes', () => {
        const { result, rerender } = renderHook(({ event }) => useEventForm(event, vi.fn()), {
            initialProps: { event: null },
        });

        expect(result.current.isEditing).toBe(false);

        // Update prop
        rerender({ event: { id: 1 } });
        expect(result.current.isEditing).toBe(true);
        expect(FormUtilsModule.getInitialForm).toHaveBeenCalledTimes(3); // Initial (state) + Initial (effect) + update
    });

    it('should handle setForm updates', () => {
        const { result } = renderHook(() => useEventForm(null, vi.fn()));
        act(() => {
            result.current.setForm({ ...mockInitialForm, title: 'Updated' });
        });
        expect(result.current.form.title).toBe('Updated');
    });

    it('should call validateAndSubmit on handleSubmit', () => {
        const onClose = vi.fn();
        const event = { id: 1 };
        const { result } = renderHook(() => useEventForm(event, onClose));

        const mockE = { preventDefault: vi.fn() };
        act(() => {
            result.current.handleSubmit(mockE);
        });

        expect(FormUtilsModule.validateAndSubmit).toHaveBeenCalledWith(
            mockE,
            result.current.form,
            event,
            mockActions,
            onClose,
            expect.any(Function), // setError
            expect.any(Function), // setOverlapWarning
            mockEvents,
            false // forceSave
        );
    });

    it('should call confirmDelete on handleDelete', () => {
        const onClose = vi.fn();
        const event = { id: 1 };
        const { result } = renderHook(() => useEventForm(event, onClose));

        act(() => {
            result.current.handleDelete();
        });

        expect(FormUtilsModule.confirmDelete).toHaveBeenCalledWith(
            event,
            mockActions,
            onClose
        );
    });
});
