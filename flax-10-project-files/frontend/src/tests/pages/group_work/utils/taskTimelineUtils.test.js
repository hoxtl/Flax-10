import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  WEEK_MS,
  DAY_MS,
  getTimelineAnchor,
  buildWeeks,
  placeTasksIntoWeeks,
} from '../../../../pages/group_work/utils/taskTimelineUtils';

describe('taskTimelineUtils – constants', () => {
  it('WEEK_MS is seven days in milliseconds', () => {
    expect(WEEK_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('DAY_MS is one day in milliseconds', () => {
    expect(DAY_MS).toBe(24 * 60 * 60 * 1000);
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('taskTimelineUtils – getTimelineAnchor', () => {
  it('returns a Date set to midnight', () => {
    const anchor = getTimelineAnchor();
    expect(anchor).toBeInstanceOf(Date);
    expect(anchor.getHours()).toBe(0);
  });

  it('returns a Monday', () => {
    const anchor = getTimelineAnchor();
    expect(anchor.getDay()).toBe(1);
  });

  it('treats Sunday as the end of the previous week', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T12:00:00.000Z'));
    const anchor = getTimelineAnchor();
    expect(anchor.getDay()).toBe(1);
  });
});

describe('taskTimelineUtils – buildWeeks', () => {
  it('returns 9 week descriptors', () => {
    const anchor = getTimelineAnchor();
    expect(buildWeeks(anchor)).toHaveLength(9);
  });

  it('each week has id, label, startTs, endTs', () => {
    const weeks = buildWeeks(getTimelineAnchor());
    expect(weeks[0]).toHaveProperty('id', 0);
    expect(weeks[0]).toHaveProperty('startTs');
  });
});

describe('taskTimelineUtils – placeTasksIntoWeeks', () => {
  it('returns a layout object with a key for each week', () => {
    const anchor = getTimelineAnchor();
    const weeks = buildWeeks(anchor);
    const layout = placeTasksIntoWeeks([], weeks);
    expect(Object.keys(layout)).toHaveLength(9);
  });

  it('places a task into the correct week slot', () => {
    const anchor = getTimelineAnchor();
    const weeks = buildWeeks(anchor);
    const taskDate = new Date(anchor.getTime() + DAY_MS);
    const layout = placeTasksIntoWeeks([{ id: 1, due_date: taskDate.toISOString() }], weeks);
    expect(layout[0]).toHaveLength(6);
    expect(layout[0][1]).toHaveLength(1);
    expect(layout[0][1][0].id).toBe(1);
  });

  it('skips tasks without a due date or outside the visible range', () => {
    const anchor = getTimelineAnchor();
    const weeks = buildWeeks(anchor);
    const layout = placeTasksIntoWeeks([
      { id: 1, due_date: null },
      { id: 2, due_date: new Date(anchor.getTime() + 6 * DAY_MS).toISOString() },
    ], weeks);
    expect(layout[0].flat()).toHaveLength(0);
    expect(Object.values(layout).flat(2)).toHaveLength(0);
  });
});
