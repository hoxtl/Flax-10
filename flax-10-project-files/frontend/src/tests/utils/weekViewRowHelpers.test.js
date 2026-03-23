import { describe, it, expect } from 'vitest';
import { calculateEventLayout } from '../../components/Calendar/WeekView/components/allDayRowHelpers';

// Tests for weekViewRowHelpers — covers calculateEventLayout including row assignment, column clamping, overlap handling, and sort order for all-day events

/**
 * Build a week of Date objects starting from the given Monday.
 * Using Sun-Sat to match getStartOfWeek (Sunday = day 0).
 */
function buildWeek(startDate) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

/**
 * Build an all-day event (midnight-aligned) spanning the given dates.
 * start and end are Date objects. end is exclusive in terms of the "raw" field,
 * so the visual range calculation in allDayRowHelpers will handle it.
 */
function makeAllDayEvent(id, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return {
    id,
    all_day: true,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  };
}

// Week: Sun 2024-01-07 … Sat 2024-01-13
const SUN = new Date(2024, 0, 7);
const WEEK = buildWeek(SUN);

describe('calculateEventLayout', () => {
  it('returns an empty array when no events are provided', () => {
    const result = calculateEventLayout([], WEEK);
    expect(result).toEqual([]);
  });

  it('returns an empty array when no events overlap the week', () => {
    // Event is entirely in the following week
    const event = makeAllDayEvent(1, new Date(2024, 0, 14), new Date(2024, 0, 15));
    const result = calculateEventLayout([event], WEEK);
    expect(result).toEqual([]);
  });

  it('returns one item for a single-day all-day event within the week', () => {
    // Event on Tuesday Jan 9 2024
    const event = makeAllDayEvent(1, new Date(2024, 0, 9), new Date(2024, 0, 10));
    const result = calculateEventLayout([event], WEEK);
    expect(result).toHaveLength(1);
  });

  it('assigns correct startCol and endCol for a single-day event on Tuesday (index 2)', () => {
    // Tuesday is index 2 in the week (Sun=0, Mon=1, Tue=2)
    const event = makeAllDayEvent(1, new Date(2024, 0, 9), new Date(2024, 0, 10));
    const result = calculateEventLayout([event], WEEK);
    const item = result[0];
    // startCol = idx + 1 = 2 + 1 = 3, endCol = idx + 2 = 2 + 2 = 4
    expect(item.startCol).toBe(3);
    expect(item.endCol).toBe(4);
  });

  it('assigns correct row = 1 for the only event', () => {
    const event = makeAllDayEvent(1, new Date(2024, 0, 8), new Date(2024, 0, 9));
    const result = calculateEventLayout([event], WEEK);
    expect(result[0].row).toBe(1);
  });

  it('places two non-overlapping events on the same row', () => {
    // Mon Jan 8 and Thu Jan 11 — different columns, no collision
    const event1 = makeAllDayEvent(1, new Date(2024, 0, 8), new Date(2024, 0, 9));
    const event2 = makeAllDayEvent(2, new Date(2024, 0, 11), new Date(2024, 0, 12));
    const result = calculateEventLayout([event1, event2], WEEK);
    expect(result).toHaveLength(2);
    const rows = result.map(r => r.row);
    expect(rows).toContain(1);
    // Both events are non-overlapping so both should be in row 1
    expect(rows.every(r => r === 1)).toBe(true);
  });

  it('places two overlapping events on different rows', () => {
    // Both events span Mon–Wed
    const event1 = makeAllDayEvent(1, new Date(2024, 0, 8), new Date(2024, 0, 11));
    const event2 = makeAllDayEvent(2, new Date(2024, 0, 8), new Date(2024, 0, 11));
    const result = calculateEventLayout([event1, event2], WEEK);
    expect(result).toHaveLength(2);
    const rows = result.map(r => r.row);
    expect(Math.min(...rows)).toBe(1);
    expect(Math.max(...rows)).toBe(2);
  });

  it('handles a multi-day event spanning the full week', () => {
    // Sunday through Saturday, covering all seven days.
    const event = makeAllDayEvent(1, new Date(2024, 0, 7), new Date(2024, 0, 14));
    const result = calculateEventLayout([event], WEEK);
    expect(result).toHaveLength(1);
    // startCol = 0+1 = 1, endCol = 6+2 = 8
    expect(result[0].startCol).toBe(1);
    expect(result[0].endCol).toBe(8);
  });

  it('clamps an event starting before the week to column 1', () => {
    // Event starts the week before (Dec 31) but ends mid-week (Wed Jan 10)
    const event = makeAllDayEvent(1, new Date(2023, 11, 31), new Date(2024, 0, 10));
    const result = calculateEventLayout([event], WEEK);
    expect(result).toHaveLength(1);
    expect(result[0].startCol).toBe(1); // clamped to 0+1
  });

  it('clamps an event ending after the week to last column', () => {
    // Event starts Wed Jan 10 but ends next week (Jan 16)
    const event = makeAllDayEvent(1, new Date(2024, 0, 10), new Date(2024, 0, 16));
    const result = calculateEventLayout([event], WEEK);
    expect(result).toHaveLength(1);
    // endIdx = days.length - 1 = 6, endCol = 6+2 = 8
    expect(result[0].endCol).toBe(8);
  });

  it('returns items sorted by startCol ascending', () => {
    const event1 = makeAllDayEvent(1, new Date(2024, 0, 11), new Date(2024, 0, 12)); // Thu
    const event2 = makeAllDayEvent(2, new Date(2024, 0, 8), new Date(2024, 0, 9));  // Mon
    const result = calculateEventLayout([event1, event2], WEEK);
    expect(result[0].startCol).toBeLessThanOrEqual(result[1].startCol);
  });

  it('each result item has event, startCol, endCol, and row properties', () => {
    const event = makeAllDayEvent(1, new Date(2024, 0, 8), new Date(2024, 0, 10));
    const result = calculateEventLayout([event], WEEK);
    const item = result[0];
    expect(item).toHaveProperty('event');
    expect(item).toHaveProperty('startCol');
    expect(item).toHaveProperty('endCol');
    expect(item).toHaveProperty('row');
  });

  it('three mutually overlapping events use three rows', () => {
    const event1 = makeAllDayEvent(1, new Date(2024, 0, 8), new Date(2024, 0, 11));
    const event2 = makeAllDayEvent(2, new Date(2024, 0, 8), new Date(2024, 0, 11));
    const event3 = makeAllDayEvent(3, new Date(2024, 0, 8), new Date(2024, 0, 11));
    const result = calculateEventLayout([event1, event2, event3], WEEK);
    expect(result).toHaveLength(3);
    const rows = new Set(result.map(r => r.row));
    expect(rows.size).toBe(3);
  });

  it('wider events sort before narrower ones with same startCol', () => {
    // Two events starting same day but different lengths; wider should get row 1
    const wideEvent = makeAllDayEvent(1, new Date(2024, 0, 8), new Date(2024, 0, 13));
    const narrowEvent = makeAllDayEvent(2, new Date(2024, 0, 8), new Date(2024, 0, 10));
    const result = calculateEventLayout([narrowEvent, wideEvent], WEEK);
    // wideEvent should appear first (lower startCol precedence, wider wins tie)
    // Both share startCol, wider should be sorted before narrower
    const wideResult = result.find(r => r.event.id === 1);
    const narrowResult = result.find(r => r.event.id === 2);
    expect(wideResult.row).toBeLessThan(narrowResult.row);
  });
});
