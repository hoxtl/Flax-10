/*
 * Tests for projectRowUtils: date helpers, percent, member count, countdown text, and captions.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getProjectDate,
  formatProjectDate,
  formatProjectHeadlineDate,
  getDaysLeft,
  getProjectPercent,
  getProjectMemberCount,
  formatProjectCountdownText,
  getProjectCompletedCount,
  getProjectRemainingCount,
  getProjectCaption,
  getProjectTeacherName,
  getProjectTeacherPhoto,
  compareProjectsBySort,
} from '../../../../pages/group_work/utils/projectRowUtils';

vi.mock('../../../../utils/tutorPhotoFallback.js', () => ({
  getResolvedUserPhoto: vi.fn(() => 'https://example.com/photo.jpg'),
}));

describe('projectRowUtils – getProjectDate', () => {
  it('returns null when deadline is absent', () => {
    expect(getProjectDate(null)).toBeNull();
  });

  it('returns a Date object for a valid deadline string', () => {
    expect(getProjectDate('2026-03-24')).toBeInstanceOf(Date);
  });
});

describe('projectRowUtils – formatProjectDate', () => {
  it('returns -- for null date', () => {
    expect(formatProjectDate(null)).toBe('--');
  });

  it('formats a date consistently', () => {
    const march24 = new Date('2026-03-24T12:00:00Z');
    const res = formatProjectDate(march24);
    expect(res).toMatch(/24/);
    expect(res).toMatch(/2026/);
  });
});

describe('projectRowUtils – formatProjectHeadlineDate', () => {
  it('returns -- for null date', () => {
    expect(formatProjectHeadlineDate(null)).toBe('--');
  });

  it('returns a string with ordinal day and various suffixes', () => {
    expect(formatProjectHeadlineDate(new Date('2026-03-24'))).toContain('24th');
    expect(formatProjectHeadlineDate(new Date('2026-03-01'))).toContain('1st');
    expect(formatProjectHeadlineDate(new Date('2026-03-02'))).toContain('2nd');
    expect(formatProjectHeadlineDate(new Date('2026-03-03'))).toContain('3rd');
    expect(formatProjectHeadlineDate(new Date('2026-03-11'))).toContain('11th');
    expect(formatProjectHeadlineDate(new Date('2026-03-12'))).toContain('12th');
    expect(formatProjectHeadlineDate(new Date('2026-03-13'))).toContain('13th');
  });
});

describe('projectRowUtils – getDaysLeft', () => {
  it('returns null when date is null', () => {
    expect(getDaysLeft(null)).toBeNull();
  });

  it('returns a negative number for past dates', () => {
    expect(getDaysLeft(new Date('2000-01-01'))).toBeLessThan(0);
  });
});

describe('projectRowUtils – getProjectPercent', () => {
  it('returns 0 when there are no tasks', () => {
    expect(getProjectPercent({ task_count: 0 })).toBe(0);
  });

  it('returns 50 when half the tasks are completed', () => {
    expect(getProjectPercent({ task_count: 4, completed_task_count: 2 })).toBe(50);
  });
});

describe('projectRowUtils – getProjectMemberCount', () => {
  it('uses member_count when it is a finite number', () => {
    expect(getProjectMemberCount({ member_count: 5 })).toBe(5);
  });

  it('uses members array length as fallback', () => {
    expect(getProjectMemberCount({ members: [1, 2, 3] })).toBe(3);
  });

  it('falls back to zero for invalid member_count values', () => {
    expect(getProjectMemberCount({ member_count: 'not-a-number' })).toBe(0);
  });
});

describe('projectRowUtils – formatProjectCountdownText', () => {
  it('returns empty string when date is null', () => {
    expect(formatProjectCountdownText(null)).toBe('');
  });

  it('returns overdue text for past dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatProjectCountdownText(yesterday)).toBe('1 day overdue');
    const longAgo = new Date();
    longAgo.setDate(longAgo.getDate() - 5);
    expect(formatProjectCountdownText(longAgo)).toBe('5 days overdue');
  });

  it('identifies relative deadlines with fake timers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00Z'));
    expect(formatProjectCountdownText(new Date('2026-03-24T12:00:00Z'))).toBe('1 day overdue');
    expect(formatProjectCountdownText(new Date('2026-03-25T12:00:00Z'))).toBe('Due today');
    expect(formatProjectCountdownText(new Date('2026-03-26T12:00:00Z'))).toBe('1 day left');
    expect(formatProjectCountdownText(new Date('2026-04-01T12:00:00Z'))).toBe('7 days left');
    vi.useRealTimers();
  });
});

describe('projectRowUtils – getProjectCompletedCount', () => {
  it('returns the completed task count and handles nulls', () => {
    expect(getProjectCompletedCount({ completed_task_count: 3 })).toBe(3);
    expect(getProjectCompletedCount(null)).toBe(0);
    expect(getProjectCompletedCount({})).toBe(0);
  });
});

describe('projectRowUtils – getProjectRemainingCount', () => {
  it('returns the difference and handles nulls', () => {
    expect(getProjectRemainingCount({ task_count: 5, completed_task_count: 2 })).toBe(3);
    expect(getProjectRemainingCount({ task_count: 5, completed_task_count: 10 })).toBe(0);
    expect(getProjectRemainingCount(null)).toBe(0);
    expect(getProjectRemainingCount({})).toBe(0);
  });
});

describe('projectRowUtils – getProjectCaption', () => {
  it('returns various captions based on project keywords', () => {
    expect(getProjectCaption({ name: 'Poster Submission', module_name: 'CS' })).toContain('poster');
    expect(getProjectCaption({ name: 'Moot Case', module_name: 'CS' })).toContain('speaking points');
    expect(getProjectCaption({ name: 'Final Report', module_name: 'CS' })).toContain('write-up');
    expect(getProjectCaption({ name: 'Problem Sheet', module_name: 'CS' })).toContain('core questions');
    expect(getProjectCaption({ name: 'Key Findings', module_name: 'CS' })).toContain('key evidence');
    expect(getProjectCaption({ name: 'Research Plan', module_name: 'CS' })).toContain('threads');
    expect(getProjectCaption({ name: 'Misc', module_name: 'CS' })).toContain('team aligned');
    expect(getProjectCaption({ name: null, module_name: 'CS' })).toContain('team aligned');
  });
});

it('resolves teacher name with priority', () => {
  expect(getProjectTeacherName({ module_tutor_name: 'Alice' })).toBe('Alice');
  expect(getProjectTeacherName({ module_tutor_username: 'user1' })).toBe('user1');
  expect(getProjectTeacherName({})).toBe('Module lead');
});

it('resolves a teacher photo with seed fallbacks', () => {
  expect(getProjectTeacherPhoto({ module_tutor_username: 'u1' })).toBeDefined();
  expect(getProjectTeacherPhoto({ module_tutor_id: 'i1' })).toBeDefined();
  expect(getProjectTeacherPhoto({ module_tutor_name: 'N1' })).toBeDefined();
});

describe('projectRowUtils – compareProjectsBySort (basic)', () => {
  const alpha = { name: 'Alpha', task_count: 5, completed_task_count: 2, members: [1] };
  const beta = { name: 'Beta', task_count: 3, completed_task_count: 3, members: [1, 2] };

  it('sorts by name ascending', () => {
    expect(compareProjectsBySort(alpha, beta, 'name')).toBeLessThan(0);
  });

  it('sorts by name descending and most members', () => {
    expect(compareProjectsBySort(alpha, beta, 'name-desc')).toBeGreaterThan(0);
    expect(compareProjectsBySort(alpha, beta, 'most-members')).toBeGreaterThan(0);
  });

  it('sorts by least members and completed tasks', () => {
    expect(compareProjectsBySort(alpha, beta, 'least-members')).toBeLessThan(0);
    expect(compareProjectsBySort(alpha, beta, 'most-completed')).toBeGreaterThan(0);
    expect(compareProjectsBySort(
      { ...alpha, deadline: '2026-03-01' },
      { ...beta, deadline: '2026-03-10' },
      'due-date-desc',
    )).toBeGreaterThan(0);
  });

  it('identifies identical projects in default sort tie-breaker', () => {
    const a = { name: 'Match', deadline: '2026-01-01', task_count: 5, completed_task_count: 5 };
    const b = { name: 'Match', deadline: '2026-01-01', task_count: 5, completed_task_count: 5 };
    expect(compareProjectsBySort(a, b, 'unknown')).toBe(0);
  });

  it('hits the deadline tie-breaker when names and completion match', () => {
    const a = { name: 'X', task_count: 5, completed_task_count: 5, deadline: '2026-01-01' };
    const b = { name: 'X', task_count: 5, completed_task_count: 5, deadline: '2026-01-10' };
    expect(compareProjectsBySort(a, b, 'most-members')).toBeGreaterThan(0);
  });
});
