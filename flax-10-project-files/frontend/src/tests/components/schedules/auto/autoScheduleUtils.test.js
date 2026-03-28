import { describe, it, expect } from 'vitest';
import {
    getAutoScheduleError,
    buildAutoSchedulePayload,
    getMoveTomorrowWindow,
} from '../../../../components/schedules/auto/autoScheduleUtils';

describe('getAutoScheduleError', () => {
    it('returns null when deadlines are present', () => {
        expect(getAutoScheduleError([{ id: 1 }, { id: 2 }])).toBeNull();
    });

    it('returns error string when deadlines array is empty', () => {
        expect(getAutoScheduleError([])).toBe('No upcoming deadlines to auto-schedule.');
    });
});

describe('buildAutoSchedulePayload', () => {
    it('trims the title', () => {
        const payload = buildAutoSchedulePayload('  My Plan  ', [{ id: 1 }]);
        expect(payload.title).toBe('My Plan');
    });

    it('defaults title to "Auto schedule" when blank', () => {
        expect(buildAutoSchedulePayload('   ', []).title).toBe('Auto schedule');
        expect(buildAutoSchedulePayload('', []).title).toBe('Auto schedule');
    });

    it('maps deadlines to preferences with ideal_minutes_per_day of 60', () => {
        const deadlines = [{ id: 10 }, { id: 20 }];
        const payload = buildAutoSchedulePayload('Plan', deadlines);
        expect(payload.deadline_preferences).toEqual([
            { deadline_id: 10, ideal_minutes_per_day: 60 },
            { deadline_id: 20, ideal_minutes_per_day: 60 },
        ]);
    });

    it('returns empty deadline_preferences when deadlines is empty', () => {
        expect(buildAutoSchedulePayload('Title', []).deadline_preferences).toEqual([]);
    });
});

describe('getMoveTomorrowWindow', () => {
    it('returns a window starting the next calendar day', () => {
        const event = { start_time: '2026-03-24T10:00:00Z', end_time: '2026-03-24T10:45:00Z' };
        const window = getMoveTomorrowWindow(event);
        const origDay = new Date(event.start_time).getDate();
        expect(window.start.getDate()).toBe(origDay + 1);
    });

    it('preserves the event duration in the window', () => {
        const event = { start_time: '2026-03-24T08:00:00Z', end_time: '2026-03-24T09:00:00Z' };
        const window = getMoveTomorrowWindow(event);
        const durationMins = (window.end - window.start) / 60000;
        expect(durationMins).toBe(60);
    });

    it('defaults to 25 minutes when end_time is absent', () => {
        const event = { start_time: '2026-03-24T10:00:00Z' };
        const window = getMoveTomorrowWindow(event);
        const durationMins = (window.end - window.start) / 60000;
        expect(durationMins).toBe(25);
    });

    it('uses at least 25 minutes when calculated duration is shorter', () => {
        // start and end the same gives 0 duration, should clamp to 25
        const event = { start_time: '2026-03-24T10:00:00Z', end_time: '2026-03-24T10:00:00Z' };
        const window = getMoveTomorrowWindow(event);
        const durationMins = (window.end - window.start) / 60000;
        expect(durationMins).toBe(25);
    });

    it('returns Date instances for start and end', () => {
        const event = { start_time: '2026-03-24T10:00:00Z', end_time: '2026-03-24T10:30:00Z' };
        const window = getMoveTomorrowWindow(event);
        expect(window.start).toBeInstanceOf(Date);
        expect(window.end).toBeInstanceOf(Date);
    });
});
