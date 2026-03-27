/**
 * Tests for dateValidation - date range and event time validation.
 */

import { describe, it, expect } from 'vitest';
import { validateDateRange, validateEventTimes } from '../../../../components/calendar/utils/dateValidation';

describe('validateDateRange', () => {
    it('returns null when startTime is falsy', () => {
        expect(validateDateRange(null, '2026-03-15T11:00')).toBeNull();
        expect(validateDateRange('', '2026-03-15T11:00')).toBeNull();
        expect(validateDateRange(undefined, '2026-03-15T11:00')).toBeNull();
    });

    it('returns null when endTime is falsy', () => {
        expect(validateDateRange('2026-03-15T10:00', null)).toBeNull();
        expect(validateDateRange('2026-03-15T10:00', '')).toBeNull();
        expect(validateDateRange('2026-03-15T10:00', undefined)).toBeNull();
    });

    it('returns error when start is after end', () => {
        expect(validateDateRange('2026-03-15T12:00', '2026-03-15T10:00')).toBe('Start must be before end');
    });

    it('returns error when start equals end', () => {
        expect(validateDateRange('2026-03-15T10:00', '2026-03-15T10:00')).toBe('Start must be before end');
    });

    it('returns null when start is before end', () => {
        expect(validateDateRange('2026-03-15T10:00', '2026-03-15T11:00')).toBeNull();
    });
});

describe('validateEventTimes', () => {
    it('returns error when start_time is missing', () => {
        expect(validateEventTimes({ start_time: '', end_time: '2026-03-15T11:00' })).toBe('Start time is required');
    });

    it('returns error when end_time is missing', () => {
        expect(validateEventTimes({ start_time: '2026-03-15T10:00', end_time: '' })).toBe('End time is required');
    });

    it('delegates to validateDateRange for overlap check', () => {
        expect(validateEventTimes({ start_time: '2026-03-15T12:00', end_time: '2026-03-15T10:00' })).toBe('Start must be before end');
    });

    it('returns null for valid times', () => {
        expect(validateEventTimes({ start_time: '2026-03-15T10:00', end_time: '2026-03-15T11:00' })).toBeNull();
    });
});
