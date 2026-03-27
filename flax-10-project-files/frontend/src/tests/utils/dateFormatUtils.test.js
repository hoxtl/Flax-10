import { describe, it, expect } from 'vitest';
import {
    formatTime,
    formatTimeHHMM,
    fmtDurationShort,
    formatTime12h,
    formatHour12h,
} from '../../pages/homepage/utils/dateFormatUtils';

describe('formatTime', () => {
    it('returns empty string for null or empty', () => {
        expect(formatTime(null)).toBe('');
        expect(formatTime('')).toBe('');
    });
    it('formats date string as en-GB time', () => {
        expect(formatTime('2026-01-01T14:30:00')).toMatch(/\d{1,2}:\d{2}/);
    });
});

describe('formatTimeHHMM', () => {
    it('formats a Date object to HH:MM', () => {
        const d = new Date(2026, 0, 1, 9, 5); // 09:05
        expect(formatTimeHHMM(d)).toBe('09:05');
    });

    it('formats a date string to HH:MM', () => {
        const result = formatTimeHHMM('2026-01-01T14:30:00');
        expect(result).toMatch(/14:30/);
    });
});

describe('fmtDurationShort', () => {
    it('returns empty string for null or negative', () => {
        expect(fmtDurationShort(null)).toBe('');
        expect(fmtDurationShort(-5)).toBe('');
    });

    it('returns minutes-only for < 60', () => {
        expect(fmtDurationShort(45)).toBe('45m');
    });

    it('returns hours-only for exact hours', () => {
        expect(fmtDurationShort(60)).toBe('1h');
        expect(fmtDurationShort(120)).toBe('2h');
    });

    it('returns hours and minutes', () => {
        expect(fmtDurationShort(90)).toBe('1h 30m');
    });
});

describe('formatTime12h', () => {
    it('returns empty string for null', () => {
        expect(formatTime12h(null)).toBe('');
        expect(formatTime12h('')).toBe('');
    });

    it('formats midnight as 12am', () => {
        expect(formatTime12h('2026-01-01T00:00:00')).toBe('12am');
    });

    it('formats noon as 12pm', () => {
        expect(formatTime12h('2026-01-01T12:00:00')).toBe('12pm');
    });

    it('formats AM hour without minutes', () => {
        expect(formatTime12h('2026-01-01T06:00:00')).toBe('6am');
    });

    it('formats PM hour with minutes', () => {
        expect(formatTime12h('2026-01-01T14:30:00')).toBe('2:30pm');
    });
});

describe('formatHour12h', () => {
    it('formats midnight as 12am', () => {
        expect(formatHour12h(0)).toBe('12am');
    });

    it('formats noon as 12pm', () => {
        expect(formatHour12h(12)).toBe('12pm');
    });

    it('formats PM hour', () => {
        expect(formatHour12h(14)).toBe('2pm');
    });

    it('formats AM hour with minutes', () => {
        expect(formatHour12h(9, 30)).toBe('9:30am');
    });
});
