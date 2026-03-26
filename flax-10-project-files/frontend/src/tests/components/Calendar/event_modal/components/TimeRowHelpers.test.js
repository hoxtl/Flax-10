import { describe, it, expect, vi } from 'vitest';
import { handleDateOnlyPickerChange, handleDatePickerChange, getDisplayValue, handleToggle } from '../../../../../components/calendar/event_modal/components/timeRowHelpers';

function createUpdateHandler() {
    const innerHandler = vi.fn();
    const update = vi.fn().mockReturnValue(innerHandler);
    return { innerHandler, update };
}

function expectUpdatedValue(innerHandler, value) {
    expect(innerHandler).toHaveBeenCalledWith({ target: { value } });
}

function toggleAllDay(checked) {
    const setForm = vi.fn();
    const handler = handleToggle(setForm, {});
    handler({ target: { checked } });
    return setForm.mock.calls[0][0];
}

describe('TimeRowHelpers', () => {
    describe('handleDatePickerChange', () => {
        it('should return a function that dispatches the correct value', () => {
            const { innerHandler, update } = createUpdateHandler();
            const field = 'start_time';
            const handler = handleDatePickerChange(field, update);

            handler('2025-01-01T10:00');

            expect(update).toHaveBeenCalledWith(field);
            expectUpdatedValue(innerHandler, '2025-01-01T10:00');
        });
    });

    describe('handleDateOnlyPickerChange', () => {
        it('should adjust start_time correctly', () => {
            const { innerHandler, update } = createUpdateHandler();
            const handler = handleDateOnlyPickerChange('start_time', update);

            handler('2025-01-01');

            expectUpdatedValue(innerHandler, '2025-01-01T00:00');
        });

        it('should adjust end_time correctly (+1 day)', () => {
            const { innerHandler, update } = createUpdateHandler();
            const handler = handleDateOnlyPickerChange('end_time', update);

            handler('2025-01-01');

            expectUpdatedValue(innerHandler, '2025-01-02T00:00');
        });

        it('should handle empty value', () => {
            const { innerHandler, update } = createUpdateHandler();
            const handler = handleDateOnlyPickerChange('start_time', update);

            handler('');

            expectUpdatedValue(innerHandler, '');
        });
    });

    describe('getDisplayValue', () => {
        it('should return value as is if not all day', () => {
            expect(getDisplayValue('2025-01-01T10:00', false, 'start_time')).toBe('2025-01-01T10:00');
        });

        it('should return empty values unchanged in all-day mode', () => {
            expect(getDisplayValue('', true, 'start_time')).toBe('');
        });

        it('should strip time for start_time all day', () => {
            expect(getDisplayValue('2025-01-01T10:00', true, 'start_time')).toBe('2025-01-01');
        });

        it('should subtract 1 day for end_time all day', () => {
            expect(getDisplayValue('2025-01-02T00:00', true, 'end_time')).toBe('2025-01-01');
        });
    });

    describe('handleToggle', () => {
        it('should toggle all_day state and adjust times', () => {
            const updateFn = toggleAllDay(true);
            const prev = {
                all_day: false,
                start_time: '2025-01-01T10:00',
                end_time: '2025-01-01T11:00'
            };
            const result = updateFn(prev);

            expect(result.all_day).toBe(true);
            expect(result.start_time).toBe('2025-01-01T00:00');
            expect(result.end_time).toBe('2025-01-02T00:00');
        });

        it('should toggle all_day off', () => {
            const updateFn = toggleAllDay(false);
            const prev = { all_day: true, start_time: '2025-01-01T00:00', end_time: '2025-01-02T00:00' };
            const result = updateFn(prev);

            expect(result.all_day).toBe(false);
            // Times are preserved as is when toggling off
            expect(result.start_time).toBe('2025-01-01T00:00');
            expect(result.end_time).toBe('2025-01-02T00:00');
        });

        it('preserves empty start/end values when toggling all_day on', () => {
            const updateFn = toggleAllDay(true);
            const result = updateFn({ all_day: false, start_time: '', end_time: '' });

            expect(result).toEqual({ all_day: true, start_time: '', end_time: '' });
        });
    });
});
