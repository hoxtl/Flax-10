import { describe, it, expect } from 'vitest';
import {
  WEEK_MS,
  DAY_MS,
  getTimelineAnchor,
  buildWeeks,
  placeTasksIntoWeeks,
} from '../../../pages/GroupWork/utils/taskTimelineUtils';

describe('taskTimelineUtils – constants', () => {
  it('WEEK_MS is seven days in milliseconds', () => {
    expect(WEEK_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('DAY_MS is one day in milliseconds', () => {
    expect(DAY_MS).toBe(24 * 60 * 60 * 1000);
  });
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
    expect(layout[0]).toHaveLength(1);
    expect(layout[0][0].id).toBe(1);
  });
});
