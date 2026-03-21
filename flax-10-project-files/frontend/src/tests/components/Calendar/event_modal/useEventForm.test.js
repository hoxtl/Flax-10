import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/Calendar/event_modal/useEventForm.test.js
import { useEventForm } from '../../../../components/calendar/event_modal/useEventForm';
import * as FormUtilsModule from '../../../../components/calendar/utils/formUtils';
import * as UserServiceModule from '../../../../api/userApi';
import * as SleepWarningModule from '../../../../components/settings/hooks/useSleepWarning';
=======
import { useEventForm } from '../../../../components/Calendar/EventModal/useEventForm';
import * as FormUtilsModule from '../../../../components/Calendar/utils/formUtils';
import * as UserServiceModule from '../../../../api/userApi';
import * as SleepWarningModule from '../../../../components/Settings/hooks/useSleepWarning';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/tests/components/Calendar/EventModal/useEventForm.test.js

const mockEvents = [];
const mockActions = { addEvent: vi.fn(), editEvent: vi.fn(), removeEvent: vi.fn(), addException: vi.fn() };
const mockUseCalendar = vi.fn(() => ({ events: mockEvents }));
const toastMock = vi.fn();
const mockInitialForm = {
    title: 'Form', description: '', tag: '', start_time: '', end_time: '',
    reminder: [], recurrence: { frequency: 'none' }, location: '', all_day: false
};

vi.mock('../../../../context/CalendarContext', async () => {
    const actual = await vi.importActual('../../../../context/CalendarContext');
    return {
        ...actual,
        useCalendar: () => mockUseCalendar(),
    };
});

vi.mock('../../../../components/calendar/hooks/useCalendarEvents', () => ({
    useEventActions: () => mockActions,
}));

vi.mock('../../../../components/calendar/utils/formUtils', () => ({
    getInitialForm: vi.fn(() => mockInitialForm),
    validateAndSubmit: vi.fn(),
    confirmDelete: vi.fn(), // kept for import compatibility
}));

vi.mock('../../../../context/ConfirmContext', () => ({
    useConfirm: () => vi.fn(),
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/Calendar/event_modal/useEventForm.test.js
vi.mock('../../../../context/ToastContext', () => ({
    useToast: () => toastMock,
}));

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/tests/components/Calendar/EventModal/useEventForm.test.js
vi.mock('../../../../api/userApi', () => ({
    getUserSettings: vi.fn().mockResolvedValue({ sleep_time: '23:00:00', wake_time: '07:00:00' }),
}));

vi.mock('../../../../components/settings/hooks/useSleepWarning', () => ({
    isDuringSleepWindow: vi.fn(() => false),
}));

describe('useEventForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        toastMock.mockReset();
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
            null,
            result.current.form,
            event,
            mockActions,
            onClose,
            expect.any(Function), // setError
            expect.any(Function), // confirmFn
            mockEvents,
            false // forceSave
        );
    });

    it('should expose handleConfirmSleep and handleCancelSleep', () => {
        const onClose = vi.fn();
        const event = { id: 1 };
        const { result } = renderHook(() => useEventForm(event, onClose));
        expect(typeof result.current.handleConfirmSleep).toBe('function');
        expect(typeof result.current.handleCancelSleep).toBe('function');
    });

    it('sets sleepWarning when event is during sleep window', async () => {
        const event = { id: 1 };
        const formWithTime = { ...mockInitialForm, start_time: '2026-03-10T23:30:00' };
        FormUtilsModule.getInitialForm.mockReturnValue(formWithTime);
        SleepWarningModule.isDuringSleepWindow.mockReturnValue(true);
        const { result } = renderHook(() => useEventForm(event, vi.fn()));
        await act(async () => { }); // Wait for sleepSettings to load
        act(() => { result.current.handleSubmit({ preventDefault: vi.fn() }); });
        expect(result.current.sleepWarning).toBe(true);
        FormUtilsModule.getInitialForm.mockReturnValue(mockInitialForm);
    });

    it('confirms pending submit after sleep warning', async () => {
        const event = { id: 1 };
        FormUtilsModule.getInitialForm.mockReturnValueOnce({ ...mockInitialForm, start_time: '2026-03-10T23:30:00' });
        SleepWarningModule.isDuringSleepWindow.mockReturnValue(true);
        const { result } = renderHook(() => useEventForm(event, vi.fn()));
        await act(async () => { result.current.handleSubmit({ preventDefault: vi.fn() }); });
        await act(async () => { result.current.handleConfirmSleep(); });
        expect(FormUtilsModule.validateAndSubmit).toHaveBeenCalled();
    });

    it('handleCancelSleep clears warning without submitting', async () => {
        const onClose = vi.fn();
        const event = { id: 1 };
        const startTime = '2026-03-10T23:30:00';
        FormUtilsModule.getInitialForm.mockReturnValueOnce({
            ...mockInitialForm,
            start_time: startTime,
        });
        SleepWarningModule.isDuringSleepWindow.mockReturnValue(true);

        const { result } = renderHook(() => useEventForm(event, onClose));

        await act(async () => {
            const mockE = { preventDefault: vi.fn() };
            result.current.handleSubmit(mockE);
        });

        await act(async () => {
            result.current.handleCancelSleep();
        });

        expect(result.current.sleepWarning).toBe(false);
    });

    it('handleConfirmSave calls validateAndSubmit with forceSave=true', async () => {
        const onClose = vi.fn();
        const event = { id: 1 };
        const { result } = renderHook(() => useEventForm(event, onClose));
        await act(async () => { result.current.handleConfirmSave(); });
        expect(FormUtilsModule.validateAndSubmit).toHaveBeenCalledWith(
            null,
            result.current.form,
            event,
            mockActions,
            onClose,
            expect.any(Function),
            expect.any(Function),
            mockEvents,
            true
        );
    });

    it('handleCancelSave clears overlapWarning', async () => {
        const onClose = vi.fn();
        const event = { id: 1 };
        const { result } = renderHook(() => useEventForm(event, onClose));
        act(() => { result.current.setForm({ ...result.current.form, title: 'Overlap' }); });
        act(() => { result.current.handleCancelSave(); });
        act(() => { result.current.handleCancelSave(); });
        expect(result.current.overlapWarning).toBeNull();
    });

    it('falls back to default sleep settings when getUserSettings fails', async () => {
        UserServiceModule.getUserSettings.mockRejectedValueOnce(new Error('fail'));
        const { result } = renderHook(() => useEventForm(null, vi.fn()));
        await act(async () => { });
        expect(result.current.sleepSettings).toEqual({ sleepTime: '23:00', wakeTime: '07:00' });
    });

    it('customSubmit handler sets error when title is empty', async () => {
        const onClose = vi.fn();
        const customSubmit = vi.fn().mockRejectedValue(new Error('Title is required'));
        FormUtilsModule.getInitialForm.mockReturnValue({ ...mockInitialForm, title: '  ' });
        const { result } = renderHook(() =>
            useEventForm(null, onClose, { customSubmit })
        );
        await act(async () => { });
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/Calendar/event_modal/useEventForm.test.js
        await act(async () => {
=======
        act(() => {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/tests/components/Calendar/EventModal/useEventForm.test.js
            result.current.handleSubmit({ preventDefault: vi.fn() });
        });
        expect(result.current.error).toBe('Title is required');
        expect(onClose).not.toHaveBeenCalled();
    });

    it('customSubmit handler calls customSubmit and onClose when title is present', async () => {
        const onClose = vi.fn();
        const customSubmit = vi.fn().mockResolvedValue(undefined);
        const formWithTitle = { ...mockInitialForm, title: 'My Event' };
        FormUtilsModule.getInitialForm.mockReturnValue(formWithTitle);
        const { result } = renderHook(() =>
            useEventForm(null, onClose, { customSubmit })
        );
        await act(async () => { });
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/Calendar/event_modal/useEventForm.test.js
        await act(async () => {
=======
        act(() => {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/tests/components/Calendar/EventModal/useEventForm.test.js
            result.current.handleSubmit({ preventDefault: vi.fn() });
        });
        expect(customSubmit).toHaveBeenCalledWith(result.current.form);
        expect(onClose).toHaveBeenCalled();
    });

    it('customSubmit handler also succeeds when called without an event object', async () => {
        const onClose = vi.fn();
        const customSubmit = vi.fn().mockResolvedValue(undefined);
        const formWithTitle = { ...mockInitialForm, title: 'No event arg' };
        FormUtilsModule.getInitialForm.mockReturnValue(formWithTitle);

        const { result } = renderHook(() =>
            useEventForm(null, onClose, { customSubmit })
        );

        await act(async () => { });
        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(customSubmit).toHaveBeenCalledWith(result.current.form);
        expect(onClose).toHaveBeenCalled();
    });

    it('uses default sleep/wake when getUserSettings returns empty or missing times', async () => {
        UserServiceModule.getUserSettings.mockResolvedValueOnce({});
        const { result } = renderHook(() => useEventForm(null, vi.fn()));
        await act(async () => { });
        expect(result.current.sleepSettings).toEqual({ sleepTime: '23:00', wakeTime: '07:00' });
    });

    it('handleSubmit calls doSubmit when sleepSettings loaded and event not during sleep', async () => {
        const onClose = vi.fn();
        const event = { id: 1 };
        FormUtilsModule.getInitialForm.mockReturnValue({ ...mockInitialForm, start_time: '2026-03-10T14:00:00' });
        SleepWarningModule.isDuringSleepWindow.mockReturnValue(false);
        const { result } = renderHook(() => useEventForm(event, onClose));
        await act(async () => { });
        act(() => {
            result.current.handleSubmit({ preventDefault: vi.fn() });
        });
        expect(FormUtilsModule.validateAndSubmit).toHaveBeenCalledWith(
            expect.any(Object),
            result.current.form,
            event,
            mockActions,
            onClose,
            expect.any(Function),
            expect.any(Function),
            mockEvents,
            false
        );
    });

    it('shows a success toast when editing saves successfully', async () => {
        FormUtilsModule.validateAndSubmit.mockResolvedValueOnce(true);

        const { result } = renderHook(() => useEventForm({ id: 1 }, vi.fn()));
        await act(async () => { });
        await act(async () => {
            await result.current.handleSubmit({ preventDefault: vi.fn() });
        });

        expect(toastMock).toHaveBeenCalledWith('Event updated', { variant: 'success' });
    });

    it('shows a success toast when creating saves successfully', async () => {
        FormUtilsModule.validateAndSubmit.mockResolvedValueOnce(true);

        const { result } = renderHook(() => useEventForm(null, vi.fn()));
        await act(async () => { });
        await act(async () => {
            await result.current.handleSubmit({ preventDefault: vi.fn() });
        });

        expect(toastMock).toHaveBeenCalledWith('Event saved', { variant: 'success' });
    });

    it('handleConfirmSleep when no pending submit is a no-op', () => {
        const { result } = renderHook(() => useEventForm(null, vi.fn()));
        expect(() => act(() => result.current.handleConfirmSleep())).not.toThrow();
    });

    it('uses empty events array when calendar context has no events', async () => {
        mockUseCalendar.mockReturnValueOnce({});
        const onClose = vi.fn();
        const { result } = renderHook(() => useEventForm({ id: 1 }, onClose));
        await act(async () => { result.current.handleSubmit({ preventDefault: vi.fn() }); });
        expect(FormUtilsModule.validateAndSubmit).toHaveBeenCalledWith(
            null,
            expect.anything(),
            expect.anything(),
            expect.anything(),
            onClose,
            expect.any(Function),
            expect.any(Function),
            [],
            false
        );
    });

    it('handleSubmit with no event argument still calls doSubmit', async () => {
        const onClose = vi.fn();
        const { result } = renderHook(() => useEventForm({ id: 1 }, onClose));
        await act(async () => { });
        await act(async () => { result.current.handleSubmit(); });
        expect(FormUtilsModule.validateAndSubmit).toHaveBeenCalled();
    });

    it('customSubmit handler sets error when form.title is undefined', async () => {
        const customSubmit = vi.fn().mockRejectedValue(new Error('Title is required'));
        const onClose = vi.fn();
        FormUtilsModule.getInitialForm.mockReturnValue({ ...mockInitialForm, title: undefined });
        const { result } = renderHook(() =>
            useEventForm(null, onClose, { customSubmit })
        );
        await act(async () => { });
        await act(async () => { result.current.handleSubmit({ preventDefault: vi.fn() }); });
        expect(result.current.error).toBe('Title is required');
        expect(onClose).not.toHaveBeenCalled();
    });

    it('handleConfirmSave passes setOverlapWarning as confirmFn (7th arg) and it updates state when invoked', async () => {
        let capturedSetOverlap;
        FormUtilsModule.validateAndSubmit.mockImplementation(async (_e, _form, _event, _actions, _onClose, _setError, setOverlapWarning) => {
            capturedSetOverlap = setOverlapWarning;
        });
        const onClose = vi.fn();
        const { result } = renderHook(() => useEventForm({ id: 1 }, onClose));
        await act(async () => { });
        await act(async () => result.current.handleConfirmSave());
        expect(capturedSetOverlap).toBeDefined();
        act(() => capturedSetOverlap([{ id: 2, title: 'Other Event' }]));
        expect(result.current.overlapWarning).toEqual([{ id: 2, title: 'Other Event' }]);
    });

    it('effect runs when options.initialTag or options.initialDate changes', () => {
        const { rerender } = renderHook(
            ({ opts }) => useEventForm(null, vi.fn(), opts),
            { initialProps: { opts: { initialTag: 'a', initialDate: '2026-01-01' } } }
        );
        expect(FormUtilsModule.getInitialForm).toHaveBeenCalled();
        FormUtilsModule.getInitialForm.mockClear();
        rerender({ opts: { initialTag: 'b', initialDate: '2026-01-02' } });
        expect(FormUtilsModule.getInitialForm).toHaveBeenCalledWith(null, expect.objectContaining({ initialTag: 'b', initialDate: '2026-01-02' }));
    });
});
