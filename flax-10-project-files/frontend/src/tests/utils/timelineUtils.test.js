import { describe, it, expect } from 'vitest';
import {
    getDailyEnergyPercent,
    getNowLinePercent,
    getPeakHours,
    getUrgencyLevel,
    getDailyNarrative,
    groupOverlaps,
    computeTimelineWithGaps,
    getSmartWindowLabel,
    minsFromDayStart,
    getGapStartDate,
    DAY_START_HOUR,
    DAY_END_HOUR,
    GAP_CARD_THRESHOLD_MINS,
} from '../../pages/homepage/utils/timelineUtils';

describe('getDailyEnergyPercent', () => {
    it('returns a number between 0 and 100', () => {
        const result = getDailyEnergyPercent();
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
    });
});

describe('getNowLinePercent', () => {
    it('returns null for null inputs', () => {
        expect(getNowLinePercent(null, null)).toBeNull();
    });

    it('returns null when current time is outside range', () => {
        const past1 = new Date(Date.now() - 120000).toISOString();
        const past2 = new Date(Date.now() - 60000).toISOString();
        expect(getNowLinePercent(past1, past2)).toBeNull();
    });

    it('returns percent when current time is within range', () => {
        const past = new Date(Date.now() - 60000).toISOString();
        const future = new Date(Date.now() + 60000).toISOString();
        const result = getNowLinePercent(past, future);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThan(100);
    });
});

describe('getPeakHours', () => {
    it('returns empty for null or invalid heatmap', () => {
        expect(getPeakHours(null)).toEqual([]);
        expect(getPeakHours({ data: null })).toEqual([]);
    });

    it('returns top 3 peak hours', () => {
        const heatmap = {
            data: [
                [0, 5, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0],
                [0, 4, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            ],
        };
        const peaks = getPeakHours(heatmap);
        expect(peaks).toHaveLength(3);
        expect(peaks[0].hour).toBe(1); // highest total
    });
});

describe('getUrgencyLevel', () => {
    it('returns normal when no deadlines', () => {
        expect(getUrgencyLevel([], null)).toBe('normal');
    });

    it('returns urgent when deadline within 3 days and low focus', () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const deadlines = [{ start_due_date: tomorrow }];
        const progress = { daily_progress: [{ date: new Date().toISOString().slice(0, 10), actual_hours: 0 }] };
        expect(getUrgencyLevel(deadlines, progress)).toBe('urgent');
    });

    it('returns normal when focus is sufficient even with close deadline', () => {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const deadlines = [{ start_due_date: tomorrow }];
        const progress = { daily_progress: [{ date: new Date().toISOString().slice(0, 10), actual_hours: 3 }] };
        expect(getUrgencyLevel(deadlines, progress)).toBe('normal');
    });
});

describe('getDailyNarrative', () => {
    const selectedDate = new Date('2026-03-07');

    it('returns Free type when no events', () => {
        const result = getDailyNarrative(selectedDate, []);
        expect(result.dayType).toBe('Free');
        expect(result.sessionCount).toBe(0);
    });

    it('returns Lecture Heavy when 3+ lectures', () => {
        const lectures = [
            { title: 'Lecture 1', start_time: '2026-03-07T09:00:00', end_time: '2026-03-07T10:00:00' },
            { title: 'Lecture 2', start_time: '2026-03-07T11:00:00', end_time: '2026-03-07T12:00:00' },
            { title: 'Lecture 3', start_time: '2026-03-07T14:00:00', end_time: '2026-03-07T15:00:00' },
        ];
        const result = getDailyNarrative(selectedDate, lectures);
        expect(result.dayType).toBe('Lecture Heavy');
    });

    it('returns Moderate when 1-2 lectures', () => {
        const lectures = [
            { title: 'Lecture 1', start_time: '2026-03-07T09:00:00', end_time: '2026-03-07T10:00:00' },
        ];
        const result = getDailyNarrative(selectedDate, lectures);
        expect(result.dayType).toBe('Moderate');
    });

    it('returns best window when free time exists', () => {
        const events = [
            { title: 'Meeting', start_time: '2026-03-07T18:00:00', end_time: '2026-03-07T19:00:00', source: null },
        ];
        const result = getDailyNarrative(selectedDate, events);
        expect(result.bestWindowStart).toBeTruthy();
    });
});

describe('groupOverlaps', () => {
    it('returns empty for empty input', () => {
        expect(groupOverlaps([])).toEqual([]);
    });

    it('wraps single non-overlapping items as single', () => {
        const items = [
            { start_time: '2026-01-01T09:00:00', end_time: '2026-01-01T10:00:00' },
            { start_time: '2026-01-01T11:00:00', end_time: '2026-01-01T12:00:00' },
        ];
        const groups = groupOverlaps(items);
        expect(groups).toHaveLength(2);
        groups.forEach(g => expect(g.type).toBe('single'));
    });

    it('clusters overlapping items', () => {
        const items = [
            { start_time: '2026-01-01T09:00:00', end_time: '2026-01-01T11:00:00' },
            { start_time: '2026-01-01T10:00:00', end_time: '2026-01-01T12:00:00' },
        ];
        const groups = groupOverlaps(items);
        expect(groups).toHaveLength(1);
        expect(groups[0].type).toBe('cluster');
    });
});

describe('computeTimelineWithGaps', () => {
    it('returns items without gaps when events are close together', () => {
        const items = [
            { start_time: '2026-01-01T09:00:00', end_time: '2026-01-01T10:00:00' },
            { start_time: '2026-01-01T10:10:00', end_time: '2026-01-01T11:00:00' },
        ];
        const result = computeTimelineWithGaps(items, []);
        const types = result.map(r => r.type);
        expect(types).not.toContain('gap');
    });

    it('adds gap card between items with 30+ minute gap', () => {
        const items = [
            { start_time: '2026-01-01T09:00:00', end_time: '2026-01-01T10:00:00' },
            { start_time: '2026-01-01T11:00:00', end_time: '2026-01-01T12:00:00' },
        ];
        const result = computeTimelineWithGaps(items, []);
        const gap = result.find(r => r.type === 'gap');
        expect(gap).toBeTruthy();
        expect(gap.minutes).toBe(60);
    });
});

describe('getSmartWindowLabel', () => {
    it('returns morning label for 8-11am', () => {
        const d = new Date('2026-01-01T09:00:00');
        const result = getSmartWindowLabel(d);
        expect(result.variant).toBe('morning');
    });

    it('returns midday label for 11am-3pm', () => {
        const d = new Date('2026-01-01T12:00:00');
        const result = getSmartWindowLabel(d);
        expect(result.variant).toBe('midday');
    });

    it('returns evening label for 5pm-midnight', () => {
        const d = new Date('2026-01-01T18:00:00');
        const result = getSmartWindowLabel(d);
        expect(result.variant).toBe('evening');
    });

    it('returns early label for 5-8am', () => {
        const d = new Date('2026-01-01T06:00:00');
        const result = getSmartWindowLabel(d);
        expect(result.variant).toBe('default');
    });

    it('returns default for other times', () => {
        const d = new Date('2026-01-01T03:00:00');
        const result = getSmartWindowLabel(d);
        expect(result.variant).toBe('default');
    });
});

describe('minsFromDayStart', () => {
    it('calculates minutes from DAY_START_HOUR', () => {
        const d = new Date('2026-01-01T08:30:00');
        // DAY_START_HOUR = 6, so 8h30m - 6h = 2h30m = 150 mins
        expect(minsFromDayStart(d)).toBe(150);
    });

    it('accepts a date string', () => {
        const result = minsFromDayStart('2026-01-01T07:00:00');
        expect(result).toBe(60); // 7am - 6am = 60 min
    });
});

describe('getGapStartDate', () => {
    it('returns correct date at offset from day start', () => {
        const selectedDate = new Date('2026-01-01');
        const result = getGapStartDate(selectedDate, 90); // DAY_START_HOUR=6, +90 min = 7:30am
        expect(result.getHours()).toBe(7);
        expect(result.getMinutes()).toBe(30);
    });
});

describe('constants', () => {
    it('has correct DAY_START_HOUR', () => {
        expect(DAY_START_HOUR).toBe(6);
    });

    it('has correct DAY_END_HOUR', () => {
        expect(DAY_END_HOUR).toBe(22);
    });

    it('has correct GAP_CARD_THRESHOLD_MINS', () => {
        expect(GAP_CARD_THRESHOLD_MINS).toBe(30);
    });
});
