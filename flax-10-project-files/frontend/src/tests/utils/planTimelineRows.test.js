import { describe, it, expect, vi } from 'vitest';
import { computePlanTimelineRows } from '../../pages/homepage/utils/planTimelineRows';

vi.mock('../../pages/homepage/utils/eventUtils', () => ({
    isNow: vi.fn().mockReturnValue(false),
    extractModuleCode: vi.fn().mockReturnValue(null),
    isRoutineEvent: vi.fn().mockReturnValue(false),
}));

const DAY_START = 6; // matches DAY_START_HOUR in timelineUtils

function makeEvent(id, startHour, endHour, opts = {}) {
    const date = opts.date || '2026-03-07';
    const pad = (n) => String(n).padStart(2, '0');
    return {
        id,
        title: opts.title || `Event ${id}`,
        start_time: `${date}T${pad(startHour)}:00:00`,
        end_time: `${date}T${pad(endHour)}:00:00`,
        location: opts.location || null,
        source: opts.source || null,
        tag: opts.tag || null,
        ...opts,
    };
}

const selectedDate = new Date('2026-03-07');
const dayStart = new Date('2026-03-07T06:00:00');
const dayEnd = new Date('2026-03-07T22:00:00');
const now = new Date('2026-03-07T11:00:00');
const isToday = (d) => new Date(d).toDateString() === selectedDate.toDateString();
const notToday = () => false;

describe('computePlanTimelineRows', () => {
    it('returns empty array for no events', () => {
        const rows = computePlanTimelineRows([], selectedDate, dayStart, dayEnd, now, [], [], notToday);
        expect(rows).toEqual([]);
    });

    it('returns event rows for single event', () => {
        const events = [makeEvent(1, 9, 10)];
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const eventRows = rows.filter(r => r.type === 'event');
        expect(eventRows).toHaveLength(1);
        expect(eventRows[0].id).toBe(1);
    });

    it('calculates startMins and endMins correctly', () => {
        const events = [makeEvent(1, 9, 10)]; // 9am-10am: DAY_START=6, so startMins=180, endMins=240
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const eventRow = rows.find(r => r.type === 'event');
        expect(eventRow.startMins).toBe((9 - DAY_START) * 60); // 180
        expect(eventRow.endMins).toBe((10 - DAY_START) * 60);  // 240
        expect(eventRow.durationMins).toBe(60);
    });

    it('adds gap row for 30+ minute gap between events', () => {
        const events = [makeEvent(1, 9, 10), makeEvent(2, 11, 12)];
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const freeRows = rows.filter(r => r.type === 'free');
        expect(freeRows).toHaveLength(1);
        expect(freeRows[0].minutes).toBe(60);
    });

    it('adds tinyGap for gap smaller than threshold', () => {
        const events = [makeEvent(1, 9, 10), makeEvent(2, 10, 11, { start_time: '2026-03-07T10:15:00', end_time: '2026-03-07T11:00:00' })];
        // Override with 15-min gap
        const ev1 = { ...makeEvent(1, 9, 10) };
        const ev2 = { id: 2, title: 'Event 2', start_time: '2026-03-07T10:15:00', end_time: '2026-03-07T11:00:00', location: null };
        const rows = computePlanTimelineRows([ev1, ev2], selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const tinyGaps = rows.filter(r => r.type === 'tinyGap');
        expect(tinyGaps).toHaveLength(1);
        expect(tinyGaps[0].minutes).toBe(15);
    });

    it('does not add gap for back-to-back events', () => {
        const events = [makeEvent(1, 9, 10), makeEvent(2, 10, 11)];
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const gaps = rows.filter(r => r.type === 'free' || r.type === 'tinyGap');
        expect(gaps).toHaveLength(0);
    });

    it('inserts now marker when isToday and within range', () => {
        const events = [makeEvent(1, 9, 10), makeEvent(2, 12, 13)];
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], isToday);
        const nowMarkers = rows.filter(r => r.type === 'now');
        expect(nowMarkers).toHaveLength(1);
        expect(nowMarkers[0].nowMins).toBe((11 - DAY_START) * 60); // 5*60=300
    });

    it('does not insert now marker when not today', () => {
        const events = [makeEvent(1, 9, 10)];
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const nowMarkers = rows.filter(r => r.type === 'now');
        expect(nowMarkers).toHaveLength(0);
    });

    it('marks past events correctly', () => {
        const events = [makeEvent(1, 8, 9)]; // 8-9am, now is 11am
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const eventRow = rows.find(r => r.type === 'event');
        expect(eventRow.isPast).toBe(true);
    });

    it('marks future events as not past', () => {
        const events = [makeEvent(1, 14, 15)]; // 2-3pm, now is 11am
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const eventRow = rows.find(r => r.type === 'event');
        expect(eventRow.isPast).toBe(false);
    });

    it('adds hourMark rows', () => {
        const events = [makeEvent(1, 9, 10), makeEvent(2, 12, 13)];
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const hourMarks = rows.filter(r => r.type === 'hourMark');
        expect(hourMarks.length).toBeGreaterThan(0);
    });

    it('suppresses duplicate gutter time when an hour mark already shows the same exact hour', () => {
        const events = [
            {
                id: 1,
                title: 'Late lecture',
                start_time: '2026-03-07T18:00:00',
                end_time: '2026-03-07T18:45:00',
                location: null,
            },
            makeEvent(2, 19, 20),
        ];
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const eventAtSevenPm = rows.find((r) => r.type === 'event' && r.id === 2);
        expect(eventAtSevenPm).toBeTruthy();
        expect(eventAtSevenPm.hideTimeLabel).toBe(true);
    });

    it('does not inject a stale hour mark after a row that already spans past that hour', () => {
        const rows = computePlanTimelineRows([
            {
                id: 1,
                title: 'Reply to emails',
                start_time: '2026-03-07T16:30:00',
                end_time: '2026-03-07T17:15:00',
                location: null,
            },
            {
                id: 2,
                title: 'Study at library',
                start_time: '2026-03-07T17:45:00',
                end_time: '2026-03-07T18:45:00',
                location: null,
            },
        ], selectedDate, dayStart, dayEnd, now, [], [], notToday);

        const fivePmMark = rows.find((row) => row.type === 'hourMark' && row.hour === 17);
        expect(fivePmMark).toBeUndefined();
    });

    it('filters out events outside the day window', () => {
        const pastEvent = { id: 99, title: 'Yesterday', start_time: '2026-03-06T09:00:00', end_time: '2026-03-06T10:00:00', location: null };
        const rows = computePlanTimelineRows([pastEvent], selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const eventRows = rows.filter(r => r.type === 'event');
        expect(eventRows).toHaveLength(0);
    });

    it('groups overlapping events into eventGroup', () => {
        const ev1 = makeEvent(1, 9, 11); // 9-11am
        const ev2 = makeEvent(2, 10, 12); // 10am-12pm (overlaps with ev1)
        const rows = computePlanTimelineRows([ev1, ev2], selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const groups = rows.filter(r => r.type === 'eventGroup');
        expect(groups).toHaveLength(1);
        expect(groups[0].items).toHaveLength(2);
    });

    it('marks matchTask when event title matches a dayTask', () => {
        const events = [makeEvent(1, 9, 10, { title: 'Read Chapter 1' })];
        const dayTasks = [{ title: 'Read Chapter 1' }];
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, dayTasks, [], notToday);
        const eventRow = rows.find(r => r.type === 'event');
        expect(eventRow.matchTask).toBeTruthy();
    });

    it('marks isOverlap true for overlapping events', () => {
        const ev1 = makeEvent(1, 9, 11);
        const ev2 = makeEvent(2, 10, 12);
        const rows = computePlanTimelineRows([ev1, ev2], selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const eventRows = rows.filter(r => r.type === 'event');
        // In grouped, might not have individual event rows; check eventGroup items
        const group = rows.find(r => r.type === 'eventGroup');
        if (group) {
            expect(group.items.some(item => item.isOverlap)).toBe(true);
        } else {
            eventRows.forEach(r => expect(r.isOverlap).toBe(true));
        }
    });

    it('gap context is study by default', () => {
        const events = [makeEvent(1, 9, 10), makeEvent(2, 12, 13)];
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const freeRow = rows.find(r => r.type === 'free');
        expect(freeRow).toBeTruthy();
        expect(freeRow.gapContext).toBeTruthy();
        expect(freeRow.gapContext.type).toBe('study');
    });

    it('gap context is evening for gaps starting at 18:00+', () => {
        const events = [makeEvent(1, 17, 18), makeEvent(2, 20, 21)];
        const rows = computePlanTimelineRows(events, selectedDate, dayStart, dayEnd, now, [], [], notToday);
        const freeRow = rows.find(r => r.type === 'free');
        if (freeRow) {
            expect(freeRow.gapContext.type).toBe('evening');
        }
    });

    it('handles empty events array gracefully', () => {
        expect(() => computePlanTimelineRows(null, selectedDate, dayStart, dayEnd, now, [], [], notToday)).not.toThrow();
    });
});
