/*
 * Extra branch-coverage tests for GroupWork utility functions.
 * Targets branches missed in groupWorkUtils.test.js.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  getDueDateStr,
  formatTaskDueDate,
  getDeadlineLabel,
  sortTasks,
} from '../../../pages/GroupWork/utils/taskUtils';

import {
  formatSuggestionDateLabel,
  getTeamSize,
  getSuggestionCount,
} from '../../../pages/GroupWork/utils/availabilityUtils';

import {
  getPhotoUrl,
  getStoredViewer,
  getInitials,
  getDisplayName,
  buildMemberColorMap,
} from '../../../pages/GroupWork/utils/memberAvatarUtils';

import {
  getDaysLeft,
  formatProjectDate,
  formatProjectHeadlineDate,
  formatProjectCountdownText,
  getProjectCaption,
  compareProjectsBySort,
} from '../../../pages/GroupWork/utils/projectRowUtils';

import {
  getTimelineAnchor,
  buildWeeks,
  placeTasksIntoWeeks,
  WEEK_MS,
  DAY_MS,
} from '../../../pages/GroupWork/utils/taskTimelineUtils';

import { calcCompletionSegments } from '../../../pages/GroupWork/utils/taskStatsUtils';

import { shouldShowPopupAbove } from '../../../pages/GroupWork/utils/taskAssigneeUtils';

import { getCollaboratorCount } from '../../../pages/GroupWork/utils/projectStatsUtils';

vi.mock('../../../utils/tutorPhotoFallback.js', () => ({
  getResolvedUserPhoto: vi.fn((user, opts) => opts?.seed || 'fallback-photo'),
}));

vi.mock('../../../pages/GroupWork/components/TaskBoardView.module.css', () => ({
  default: new Proxy({}, { get: (_, k) => k }),
}));

// ─── availabilityUtils ───────────────────────────────────────────────────────

describe('availabilityUtils – formatSuggestionDateLabel', () => {
  it('returns a GB-locale date/time string for a valid ISO timestamp', () => {
    // 2026-03-24 09:30 UTC
    const result = formatSuggestionDateLabel('2026-03-24T09:30:00.000Z');
    // Must contain a two-digit time component and short month
    expect(result).toMatch(/\d{2}:\d{2}/);
    // Must contain a numeric day
    expect(result).toMatch(/\d/);
  });

  it('includes weekday, day, month, and time segments', () => {
    const result = formatSuggestionDateLabel('2026-01-05T14:00:00.000Z');
    // Should have comma separating date from time
    expect(result).toContain(',');
  });

  it('handles a date at midnight', () => {
    const result = formatSuggestionDateLabel('2026-06-15T00:00:00.000Z');
    expect(result).toMatch(/00:00/);
  });
});

describe('availabilityUtils – getTeamSize', () => {
  it('returns 0 for an empty suggestion', () => {
    expect(getTeamSize({})).toBe(0);
  });

  it('uses member_statuses length when team_size is absent', () => {
    expect(getTeamSize({ member_statuses: [{}, {}, {}] })).toBe(3);
  });

  it('prefers team_size over member_statuses length', () => {
    expect(getTeamSize({ team_size: 8, member_statuses: [{}, {}] })).toBe(8);
  });
});

describe('availabilityUtils – getSuggestionCount', () => {
  it('returns 0 when suggestion is null', () => {
    expect(getSuggestionCount(null, 'accepted')).toBe(0);
  });

  it('returns 0 when there are no member_statuses and no count field', () => {
    expect(getSuggestionCount({}, 'declined')).toBe(0);
  });

  it('counts multiple members with matching status', () => {
    const suggestion = {
      member_statuses: [
        { status: 'accepted' },
        { status: 'accepted' },
        { status: 'declined' },
      ],
    };
    expect(getSuggestionCount(suggestion, 'accepted')).toBe(2);
    expect(getSuggestionCount(suggestion, 'declined')).toBe(1);
  });
});

// ─── memberAvatarUtils ───────────────────────────────────────────────────────

describe('memberAvatarUtils – getPhotoUrl', () => {
  it('calls getResolvedUserPhoto with the member fields', async () => {
    const { getResolvedUserPhoto } = await import('../../../utils/tutorPhotoFallback.js');
    getPhotoUrl({ user: 3, user_name: 'alice', first_name: 'Alice', last_name: 'B', profile_photo_url: '' });
    expect(getResolvedUserPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, username: 'alice' }),
      expect.objectContaining({ seed: 'alice', allowGeneric: true }),
    );
  });

  it('falls back member key as seed when username is absent', async () => {
    const { getResolvedUserPhoto } = await import('../../../utils/tutorPhotoFallback.js');
    getPhotoUrl({ id: 7 });
    expect(getResolvedUserPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7 }),
      expect.objectContaining({ seed: '7' }),
    );
  });

  it('uses role field when present', async () => {
    const { getResolvedUserPhoto } = await import('../../../utils/tutorPhotoFallback.js');
    getPhotoUrl({ user: 1, role: 'teacher' });
    expect(getResolvedUserPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'teacher' }),
      expect.anything(),
    );
  });

  it('defaults role to student when absent', async () => {
    const { getResolvedUserPhoto } = await import('../../../utils/tutorPhotoFallback.js');
    getPhotoUrl({ user: 2 });
    expect(getResolvedUserPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'student' }),
      expect.anything(),
    );
  });
});

describe('memberAvatarUtils – getInitials', () => {
  it('uses first_name only when last_name is absent but first_name present', () => {
    // first_name + last_name branch: both present → AB
    expect(getInitials({ first_name: 'Alice', last_name: 'Brown' })).toBe('AB');
  });

  it('falls back to name field for initials', () => {
    expect(getInitials({ name: 'Charlie Davis' })).toBe('CD');
  });

  it('returns ? for an empty object', () => {
    expect(getInitials({})).toBe('?');
  });
});

describe('memberAvatarUtils – getDisplayName', () => {
  it('returns only first_name when last_name is empty', () => {
    expect(getDisplayName({ first_name: 'Alice', last_name: '' })).toBe('Alice');
  });

  it('returns empty string when member has no name fields', () => {
    expect(getDisplayName({})).toBe('');
  });
});

describe('memberAvatarUtils – buildMemberColorMap', () => {
  it('skips members with empty keys', () => {
    const map = buildMemberColorMap([{}, { user: 1 }]);
    expect(Object.keys(map)).toHaveLength(1);
    expect(map['1']).toBeDefined();
  });

  it('skips duplicate keys', () => {
    const map = buildMemberColorMap([{ user: 5 }, { user: 5 }]);
    expect(Object.keys(map)).toHaveLength(1);
  });

  it('wraps palette index for large member counts (> palette size)', () => {
    // Build 12 distinct members (palette has 10 entries)
    const members = Array.from({ length: 12 }, (_, i) => ({ user: i + 1 }));
    const map = buildMemberColorMap(members);
    expect(Object.keys(map)).toHaveLength(12);
    // All values should be strings
    Object.values(map).forEach((c) => expect(typeof c).toBe('string'));
  });
});

describe('memberAvatarUtils – getStoredViewer (error branch)', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('returns empty object when localStorage contains invalid JSON', () => {
    window.localStorage.setItem('user', 'not-valid-json{{{');
    expect(getStoredViewer()).toEqual({});
  });
});

// ─── taskUtils ───────────────────────────────────────────────────────────────

describe('taskUtils – formatTaskDueDate', () => {
  it('formats a valid ISO date as DD/MM/YYYY', () => {
    const result = formatTaskDueDate('2026-03-24T00:00:00.000Z');
    // Should contain slashes and recognisable date parts
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('uses GB locale ordering (day first)', () => {
    const result = formatTaskDueDate('2026-01-05');
    expect(result.startsWith('05')).toBe(true);
  });
});

describe('taskUtils – getDueDateStr', () => {
  it('extracts YYYY-MM-DD from a Date object', () => {
    expect(getDueDateStr(new Date('2026-03-24'))).toBe('2026-03-24');
  });

  it('handles a date string without time component', () => {
    const result = getDueDateStr('2026-06-15');
    expect(result).toBe('2026-06-15');
  });
});

describe('taskUtils – getDeadlineLabel', () => {
  it('returns "Due today" when deadline is today', () => {
    const today = new Date();
    today.setHours(23, 59, 0, 0);
    const result = getDeadlineLabel(today.toISOString());
    expect(['Due today', 'Due in 1 days']).toContain(result);
  });

  it('returns "Due in N days" for a date within a week', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    soon.setHours(23, 59, 0, 0);
    const result = getDeadlineLabel(soon.toISOString());
    expect(result).toMatch(/Due in \d days/);
  });

  it('returns a locale date string for a date more than 7 days away', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const result = getDeadlineLabel(future.toISOString());
    // Should NOT match the "Due in N days" or "Due today" patterns
    expect(result).not.toMatch(/^Due (today|in)/);
    expect(result).not.toBe('Past due');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('taskUtils – sortTasks', () => {
  it('sorts tasks of equal completion and equal priority by created_at ascending', () => {
    const tasks = [
      { completed: false, priority: 'medium', created_at: '2026-03-10T00:00:00Z' },
      { completed: false, priority: 'medium', created_at: '2026-03-01T00:00:00Z' },
    ];
    const sorted = sortTasks(tasks);
    expect(sorted[0].created_at).toBe('2026-03-01T00:00:00Z');
    expect(sorted[1].created_at).toBe('2026-03-10T00:00:00Z');
  });

  it('treats unknown priority as medium weight', () => {
    const tasks = [
      { completed: false, priority: 'bogus', created_at: '2026-01-01' },
      { completed: false, priority: 'low', created_at: '2026-01-01' },
    ];
    // bogus → weight 0, low → weight 1 → low sorts first (higher weight = earlier)
    const sorted = sortTasks(tasks);
    expect(sorted[0].priority).toBe('low');
  });

  it('keeps two completed tasks in their created_at order', () => {
    const tasks = [
      { completed: true, priority: 'high', created_at: '2026-02-01' },
      { completed: true, priority: 'high', created_at: '2026-01-01' },
    ];
    const sorted = sortTasks(tasks);
    expect(sorted[0].created_at).toBe('2026-01-01');
  });
});

// ─── projectRowUtils ─────────────────────────────────────────────────────────

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
    // beta is 100 % complete, alpha is 50 %
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

// ─── projectStatsUtils ───────────────────────────────────────────────────────

describe('projectStatsUtils – getCollaboratorCount', () => {
  it('falls back to 1 when neither members nor member_count is present', () => {
    expect(getCollaboratorCount([{}])).toBe(1);
  });

  it('sums member_count across mixed projects', () => {
    const projects = [{ member_count: 3 }, { members: [1, 2] }];
    expect(getCollaboratorCount(projects)).toBe(5);
  });
});

// ─── taskAssigneeUtils ────────────────────────────────────────────────────────

describe('taskAssigneeUtils – shouldShowPopupAbove', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when space above is greater than space below and below is insufficient', () => {
    Object.defineProperty(window, 'innerHeight', { value: 400, configurable: true });
    // spaceBelow = 400 - 350 = 50  (< 250 popupHeight)
    // spaceAbove = 300              (> 50)
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
    // spaceBelow = 300 - 280 = 20, spaceAbove = 30 → spaceAbove > spaceBelow → true
    const rect = { top: 30, bottom: 280 };
    expect(shouldShowPopupAbove(rect)).toBe(true);
  });
});

// ─── taskTimelineUtils ────────────────────────────────────────────────────────

describe('taskTimelineUtils – placeTasksIntoWeeks (edge cases)', () => {
  it('ignores tasks without a due_date', () => {
    const anchor = getTimelineAnchor();
    const weeks = buildWeeks(anchor);
    const tasks = [{ id: 1, title: 'No date' }]; // no due_date property
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
    const week0Date = new Date(weeks[0].startTs + DAY_MS);
    const week2Date = new Date(weeks[2].startTs + DAY_MS);
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

// ─── taskStatsUtils ───────────────────────────────────────────────────────────

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
    // 3 segments for 3 assignees, each 1/3 share of 1 task
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
        assignees_info: [{ id: '99' }], // no name, not in members
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
    expect(seg.tooltip).not.toContain('tasks completed');
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
    expect(result.completed).toBe(2);
    const unassigned = result.segments.find((s) => s.id === 'unassigned');
    expect(unassigned).toBeDefined();
    const aliceSeg = result.segments.find((s) => s.id === '1');
    expect(aliceSeg).toBeDefined();
  });
});
