import { describe, it, expect, vi } from 'vitest';
import { getType, handleDateChange, getDisplayValue, handleToggle } from '../../../../../components/Calendar/EventModal/components/TimeRowHelpers';

describe('TimeRowHelpers', () => {
    describe('getType', () => {
        it('should return date for all day', () => {
            expect(getType(true)).toBe('date');
        });

        it('should return datetime-local for normal', () => {
            expect(getType(false)).toBe('datetime-local');
        });
    });

    describe('handleDateChange', () => {
        it('should handle normal date change', () => {
            const update = vi.fn().mockReturnValue(vi.fn());
            const handler = handleDateChange('start_time', false, update);
            handler({ target: { value: '2025-01-01T10:00' } });
            expect(update).toHaveBeenCalledWith('start_time');
            // Check the curvature call
            // update('start_time') returns a function that gets called with event
        });

        it('should adjust all day start time', () => {
            const innerHandler = vi.fn();
            const update = vi.fn().mockReturnValue(innerHandler);
            const handler = handleDateChange('start_time', true, update);
            handler({ target: { value: '2025-01-01' } });

            expect(innerHandler).toHaveBeenCalledWith({ target: { value: '2025-01-01T00:00' } });
        });

        it('should adjust all day end time +1 day', () => {
            const innerHandler = vi.fn();
            const update = vi.fn().mockReturnValue(innerHandler);
            const handler = handleDateChange('end_time', true, update);
            handler({ target: { value: '2025-01-01' } });

            // Should add 1 day to 2025-01-01 => 2025-01-02
            // And append T00:00
            expect(innerHandler).toHaveBeenCalledWith({ target: { value: '2025-01-02T00:00' } });
        });
    });

    describe('getDisplayValue', () => {
        it('should return value as is if not all day', () => {
            expect(getDisplayValue('2025-01-01T10:00', false, 'start_time')).toBe('2025-01-01T10:00');
        });

        it('should strip time for start_time all day', () => {
            expect(getDisplayValue('2025-01-01T10:00', true, 'start_time')).toBe('2025-01-01');
        });

        it('should subtract 1 day for end_time all day', () => {
            // End date is exclusive in internal storage if I recall correctly from adjustForAllDay logic (adds 1 day).
            // So for display, we subtract 1 day?
            // "getAdjustedDisplayValue": date.setDate(date.getDate() - 1);

            // Input: 2025-01-02T00:00 (Stored value for an event ending on 2025-01-01 inclusive)
            // Display: 2025-01-01
            expect(getDisplayValue('2025-01-02T00:00', true, 'end_time')).toBe('2025-01-01');
        });
    });

    describe('handleToggle', () => {
        it('should toggle all_day state', () => {
            const setForm = vi.fn();
            const form = { all_day: false };
            const handler = handleToggle(setForm, form);

            // Toggle ON
            handler({ target: { checked: true } });
            // Should call setForm with function or value. Implementation uses function update: setForm(prev => ...)
            // We can't easily inspect the function passed to setForm without mocking setForm implementation.

            // Mock setForm implementation to capture result
            let updateFn;
            setForm.mockImplementation(fn => { updateFn = fn; });
            handler({ target: { checked: true } });

            const prev = {
                all_day: false,
                start_time: '2025-01-01T10:00',
                end_time: '2025-01-01T11:00'
            };
            const result = updateFn(prev);

            expect(result.all_day).toBe(true);
            expect(result.start_time).toBe('2025-01-01T00:00');
            // End time +1 day? 2025-01-01T11:00 -> 2025-01-01 -> +1 -> 2025-01-02
            expect(result.end_time).toBe('2025-01-02T00:00');
        });

        it('should toggle all_day off', () => {
            const setForm = vi.fn();
            const handler = handleToggle(setForm, {});

            let updateFn;
            setForm.mockImplementation(fn => { updateFn = fn; });
            handler({ target: { checked: false } });

            const prev = { all_day: true };
            const result = updateFn(prev);

            expect(result.all_day).toBe(false);
        });

        it('should handle null start/end time when toggling on', () => {
            const setForm = vi.fn();
            const handler = handleToggle(setForm, {});

            let updateFn;
            setForm.mockImplementation(fn => { updateFn = fn; });
            handler({ target: { checked: true } });

            const prev = { all_day: false, start_time: null, end_time: null };
            const result = updateFn(prev);

            expect(result.all_day).toBe(true);
            expect(result.start_time).toBeNull();
            expect(result.end_time).toBeNull();
        });
    });
});
