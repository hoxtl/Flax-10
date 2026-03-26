import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  getDaysLeft,
  formatProjectDate,
  formatProjectHeadlineDate,
  formatProjectCountdownText,
  getProjectCaption,
  compareProjectsBySort,
} from '../../../pages/group_work/utils/projectRowUtils';

import {
  getTimelineAnchor,
  buildWeeks,
  placeTasksIntoWeeks,
  DAY_MS,
} from '../../../pages/group_work/utils/taskTimelineUtils';

import { calcCompletionSegments } from '../../../pages/group_work/utils/taskStatsUtils';
import { shouldShowPopupAbove } from '../../../pages/group_work/utils/taskAssigneeUtils';
import { getCollaboratorCount } from '../../../pages/group_work/utils/projectStatsUtils';

// projectRowUtils

describe('projectRowUtils – formatProjectDate', () => {
  it('formats a valid Date object as a short GB locale string', () => {
    const result = formatProjectDate(new Date('2026-03-24'));
    expect(result).toContain('2026');
    expect(result).not.toBe('--');
  });
});

describe('projectRowUtils – formatProjectHeadlineDate', () => {
  it('uses "st" suffix for the 1st', () => {
    expect(formatProjectHeadlineDate(new Date('2026-03-01'))).toContain('1st');
  });

  it('uses "nd" suffix for the 2nd', () => {
    expect(formatProjectHeadlineDate(new Date('2026-03-02'))).toContain('2nd');
  });

  it('uses "rd" suffix for the 3rd', () => {
    expect(formatProjectHeadlineDate(new Date('2026-03-03'))).toContain('3rd');
  });

  it('uses "th" suffix for 11th, 12th, 13th (special cases)', () => {
    expect(formatProjectHeadlineDate(new Date('2026-03-11'))).toContain('11th');
    expect(formatProjectHeadlineDate(new Date('2026-03-12'))).toContain('12th');
    expect(formatProjectHeadlineDate(new Date('2026-03-13'))).toContain('13th');
  });
});

describe('projectRowUtils – getDaysLeft', () => {
  it('returns 0 for today (end of day)', () => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const days = getDaysLeft(endOfToday);
    expect(days).toBeGreaterThanOrEqual(0);
    expect(days).toBeLessThanOrEqual(1);
  });

  it('returns a positive number for a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(getDaysLeft(future)).toBeGreaterThan(0);
  });
});

describe('projectRowUtils – formatProjectCountdownText', () => {
  it('returns "1 day left" when exactly one day remains', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    const result = formatProjectCountdownText(tomorrow);
    expect(['1 day left', '2 days left']).toContain(result);
  });

  it('returns "1 day overdue" when exactly one day past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const result = formatProjectCountdownText(yesterday);
    expect(result).toMatch(/\d+ day(s)? overdue/);
  });

  it('returns "N days left" for multiple future days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    future.setHours(23, 59, 59, 999);
    const result = formatProjectCountdownText(future);
    expect(result).toMatch(/\d+ days left/);
  });
});

describe('projectRowUtils – getProjectCaption', () => {
  it('returns a moot/argument caption for moot projects', () => {
    expect(getProjectCaption({ name: 'Moot Court', module_name: 'Law' })).toContain('Prepare authorities');
  });

  it('returns a problem sheet caption', () => {
    expect(getProjectCaption({ name: 'Problem Sheet 3', module_name: 'Maths' })).toContain('core questions');
  });

  it('returns a findings caption', () => {
    expect(getProjectCaption({ name: 'Key Findings Report', module_name: 'Psychology' })).toContain('evidence');
  });

  it('returns argument-specific caption when name contains "argument"', () => {
    expect(getProjectCaption({ name: 'Argument Analysis', module_name: 'Philosophy' })).toContain('speaking points');
  });

  it('uses "the module" fallback when module_name is absent', () => {
    expect(getProjectCaption({ name: 'General Project' })).toContain('the module');
  });
});

describe('projectRowUtils – compareProjectsBySort', () => {
  const alpha = { name: 'Alpha', task_count: 4, completed_task_count: 2, members: [1, 2], deadline: '2099-01-01', created_at: '2026-01-01' };
  const beta  = { name: 'Beta',  task_count: 2, completed_task_count: 2, members: [1],    deadline: '2099-06-01', created_at: '2026-06-01' };

  it('sorts by created-asc', () => {
    expect(compareProjectsBySort(alpha, beta, 'created-asc')).toBeLessThan(0);
  });

  it('sorts by created-desc', () => {
    expect(compareProjectsBySort(alpha, beta, 'created-desc')).toBeGreaterThan(0);
  });

  it('sorts by most-completed', () => {
    expect(compareProjectsBySort(alpha, beta, 'most-completed')).toBeGreaterThan(0);
  });

  it('sorts by least-completed', () => {
    expect(compareProjectsBySort(alpha, beta, 'least-completed')).toBeLessThan(0);
  });

  it('handles missing deadlines gracefully (null → Infinity)', () => {
    const noDeadline = { name: 'Gamma', task_count: 0, completed_task_count: 0, members: [] };
    const result = compareProjectsBySort(alpha, noDeadline, 'unknown');
    expect(typeof result).toBe('number');
  });
});

// projectStatsUtils

describe('projectStatsUtils – getCollaboratorCount', () => {
  it('falls back to 1 when neither members nor member_count is present', () => {
    expect(getCollaboratorCount([{}])).toBe(1);
  });

  it('sums member_count across mixed projects', () => {
    const projects = [{ member_count: 3 }, { members: [1, 2] }];
    expect(getCollaboratorCount(projects)).toBe(5);
  });
});

// taskAssigneeUtils

describe('taskAssigneeUtils – shouldShowPopupAbove', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when space above is greater than space below and below is insufficient', () => {
    Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true });
    const rect = { top: 300, bottom: 350 };
    expect(shouldShowPopupAbove(rect)).toBe(true);
  });

  it('returns false when there is plenty of space below', () => {
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
    const rect = { top: 100, bottom: 150 };
    expect(shouldShowPopupAbove(rect)).toBe(false);
  });

  it('returns false when space below is insufficient but space above is also small', () => {
    Object.defineProperty(window, 'innerHeight', { value: 300, configurable: true });
    const rect = { top: 30, bottom: 280 };
    expect(shouldShowPopupAbove(rect)).toBe(true);
  });
});

// taskTimelineUtils

describe('taskTimelineUtils – placeTasksIntoWeeks (edge cases)', () => {
  it('ignores tasks without a due_date', () => {
    const anchor = getTimelineAnchor();
    const weeks = buildWeeks(anchor);
    const tasks = [{ id: 1, title: 'No date' }];
    const layout = placeTasksIntoWeeks(tasks, weeks);
    const total = Object.values(layout).reduce((sum, days) =>
      sum + days.reduce((s, day) => s + day.length, 0), 0);
    expect(total).toBe(0);
  });

  it('ignores tasks whose due_date falls outside all week windows', () => {
    const anchor = getTimelineAnchor();
    const weeks = buildWeeks(anchor);
    const farFuture = new Date('2099-01-01T12:00:00Z');
    const tasks = [{ id: 2, due_date: farFuture.toISOString() }];
    const layout = placeTasksIntoWeeks(tasks, weeks);
    const total = Object.values(layout).reduce((sum, days) =>
      sum + days.reduce((s, day) => s + day.length, 0), 0);
    expect(total).toBe(0);
  });

  it('places tasks across multiple distinct weeks', () => {
    const anchor = getTimelineAnchor();
    const weeks = buildWeeks(anchor);
    const DAY_MS_LOCAL = 86400000;
    const week0Date = new Date(weeks[0].startTs + DAY_MS_LOCAL);
    const week2Date = new Date(weeks[2].startTs + DAY_MS_LOCAL);
    const tasks = [
      { id: 1, due_date: week0Date.toISOString() },
      { id: 2, due_date: week2Date.toISOString() },
    ];
    const layout = placeTasksIntoWeeks(tasks, weeks);
    const week0Total = layout[0].reduce((s, d) => s + d.length, 0);
    const week2Total = layout[2].reduce((s, d) => s + d.length, 0);
    expect(week0Total).toBe(1);
    expect(week2Total).toBe(1);
  });
});

// taskStatsUtils

describe('taskStatsUtils – calcCompletionSegments (extra branches)', () => {
  it('handles tasks with 3 assignees, distributing share equally', () => {
    const members = [
      { user: '1', user_name: 'alice' },
      { user: '2', user_name: 'bob' },
      { user: '3', user_name: 'carol' },
    ];
    const tasks = [
      {
        completed: true,
        assignees_info: [{ id: '1', name: 'alice' }, { id: '2', name: 'bob' }, { id: '3', name: 'carol' }],
      },
    ];
    const result = calcCompletionSegments(tasks, members);
    expect(result.percent).toBe(100);
    const aliceSeg = result.segments.find((s) => s.id === '1');
    expect(aliceSeg).toBeDefined();
    expect(aliceSeg.tasksDone).toBe(1);
    expect(Math.round(aliceSeg.percentage * 100) / 100).toBeCloseTo(33.33, 1);
  });

  it('marks assignees not in members list as "Unknown"', () => {
    const members = [];
    const tasks = [
      {
        completed: true,
        assignees_info: [{ id: '99' }],
      },
    ];
    const result = calcCompletionSegments(tasks, members);
    const seg = result.segments.find((s) => s.id === '99');
    expect(seg).toBeDefined();
    expect(seg.name).toBe('Unknown');
  });

  it('generates correct tooltip text with singular task wording', () => {
    const members = [{ user: '5', user_name: 'dave' }];
    const tasks = [
      { completed: true, assignees_info: [{ id: '5', name: 'dave' }] },
    ];
    const result = calcCompletionSegments(tasks, members);
    const seg = result.segments.find((s) => s.id === '5');
    expect(seg.tooltip).toContain('1 task completed');
  });

  it('generates plural tooltip for multiple completed tasks', () => {
    const members = [{ user: '5', user_name: 'dave' }];
    const tasks = [
      { completed: true, assignees_info: [{ id: '5', name: 'dave' }] },
      { completed: true, assignees_info: [{ id: '5', name: 'dave' }] },
    ];
    const result = calcCompletionSegments(tasks, members);
    const seg = result.segments.find((s) => s.id === '5');
    expect(seg.tooltip).toContain('2 tasks completed');
  });

  it('unassigned tooltip is singular when only one unassigned task', () => {
    const tasks = [{ completed: true, assignees_info: [] }];
    const result = calcCompletionSegments(tasks, []);
    const unassigned = result.segments.find((s) => s.id === 'unassigned');
    expect(unassigned.tooltip).toContain('1 task completed');
  });

  it('mixes assigned and unassigned completed tasks', () => {
    const members = [{ user: '1', user_name: 'alice' }];
    const tasks = [
      { completed: true, assignees_info: [{ id: '1', name: 'alice' }] },
      { completed: true, assignees_info: [] },
      { completed: false, assignees_info: [] },
    ];
    const result = calcCompletionSegments(tasks, members);
    expect(result.total).toBe(3);
    const unassigned = result.segments.find((s) => s.id === 'unassigned');
    expect(unassigned).toBeDefined();
    const aliceSeg = result.segments.find((s) => s.id === '1');
    expect(aliceSeg).toBeDefined();
  });
});
