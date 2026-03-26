import { describe, it, expect, vi } from 'vitest';
import { handleDateOnlyPickerChange, handleDatePickerChange, getDisplayValue, handleToggle } from '../../../../../components/calendar/event_modal/components/timeRowHelpers';

describe('TimeRowHelpers', () => {
    describe('handleDatePickerChange', () => {
        it('should return a function that dispatches the correct value', () => {
            const innerHandler = vi.fn();
            const update = vi.fn().mockReturnValue(innerHandler);
            const field = 'start_time';
            const handler = handleDatePickerChange(field, update);

            handler('2025-01-01T10:00');

            expect(update).toHaveBeenCalledWith(field);
            expect(innerHandler).toHaveBeenCalledWith({ target: { value: '2025-01-01T10:00' } });
        });
    });

    describe('handleDateOnlyPickerChange', () => {
        it('should adjust start_time correctly', () => {
            const innerHandler = vi.fn();
            const update = vi.fn().mockReturnValue(innerHandler);
            const handler = handleDateOnlyPickerChange('start_time', update);

            handler('2025-01-01');

            expect(innerHandler).toHaveBeenCalledWith({ target: { value: '2025-01-01T00:00' } });
        });

        it('should adjust end_time correctly (+1 day)', () => {
            const innerHandler = vi.fn();
            const update = vi.fn().mockReturnValue(innerHandler);
            const handler = handleDateOnlyPickerChange('end_time', update);

            handler('2025-01-01');

            // 2025-01-01 -> 2025-01-02
            expect(innerHandler).toHaveBeenCalledWith({ target: { value: '2025-01-02T00:00' } });
        });

        it('should handle empty value', () => {
            const innerHandler = vi.fn();
            const update = vi.fn().mockReturnValue(innerHandler);
            const handler = handleDateOnlyPickerChange('start_time', update);

            handler('');

            expect(innerHandler).toHaveBeenCalledWith({ target: { value: '' } });
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
            const setForm = vi.fn();
            const handler = handleToggle(setForm, {});

            handler({ target: { checked: true } });

            const updateFn = setForm.mock.calls[0][0];
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
            const setForm = vi.fn();
            const handler = handleToggle(setForm, {});

            handler({ target: { checked: false } });

            const updateFn = setForm.mock.calls[0][0];
            const prev = { all_day: true, start_time: '2025-01-01T00:00', end_time: '2025-01-02T00:00' };
            const result = updateFn(prev);

            expect(result.all_day).toBe(false);
            // Times are preserved as is when toggling off
            expect(result.start_time).toBe('2025-01-01T00:00');
            expect(result.end_time).toBe('2025-01-02T00:00');
        });

        it('preserves empty start/end values when toggling all_day on', () => {
            const setForm = vi.fn();
            const handler = handleToggle(setForm, {});

            handler({ target: { checked: true } });

            const updateFn = setForm.mock.calls[0][0];
            const result = updateFn({ all_day: false, start_time: '', end_time: '' });

            expect(result).toEqual({ all_day: true, start_time: '', end_time: '' });
        });
    });
});
