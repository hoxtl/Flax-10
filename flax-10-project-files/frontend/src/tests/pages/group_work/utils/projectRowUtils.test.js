import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  getProjectTeacherInitials,
  getProjectTeacherEmail,
  getProjectTeacherPhoto,
  openTeacherProfile,
  compareProjectsBySort,
  getProjectMembers,
  getVisibleMembers,
} from '../../../../pages/group_work/utils/projectRowUtils';
import { getResolvedUserPhoto } from '../../../../utils/tutorPhotoFallback.js';

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
    // We check that it returns a string with some expected parts to avoid locale flakiness in CI
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

  it('identifies identical projects in default sort tie-breaker', () => {
    const a = { name: 'Match', deadline: '2026-01-01', task_count: 5, completed_task_count: 5 };
    const b = { name: 'Match', deadline: '2026-01-01', task_count: 5, completed_task_count: 5 };
    expect(compareProjectsBySort(a, b, 'unknown')).toBe(0);
  });

  it('hits the deadline tie-breaker when names and completion match', () => {
    const a = { name: 'X', task_count: 5, completed_task_count: 5, deadline: '2026-01-01' };
    const b = { name: 'X', task_count: 5, completed_task_count: 5, deadline: '2026-01-10' };
    // most-members(a,b) -> compareMemberCounts(b,a) -> memberDiff=0 -> compareCompletion(a,b)=0 -> compareDeadlines(b,a)=9
    expect(compareProjectsBySort(a, b, 'most-members')).toBeGreaterThan(0);
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

describe('projectRowUtils – getProjectTeacherInitials', () => {
  it('returns initials skipping honorifics', () => {
    expect(getProjectTeacherInitials({ module_tutor_name: 'Dr Alice Brown' })).toBe('AB');
  });

  it('falls back to ML when the teacher name is empty', () => {
    expect(getProjectTeacherInitials({ module_tutor_name: '' })).toBe('ML');
    expect(getProjectTeacherInitials({})).toBe('ML');
  });

  it('returns first two letters for single-part non-honorific names', () => {
    expect(getProjectTeacherInitials({ module_tutor_name: 'Alice' })).toBe('AL');
  });

  it('returns ML for purely non-alphanumeric names', () => {
    expect(getProjectTeacherInitials({ module_tutor_name: '!!!' })).toBe('ML');
  });

  it('handles various teacher name formats and honorifics', () => {
    expect(getProjectTeacherInitials({ module_tutor_name: 'Dr. Alice Smith' })).toBe('AS');
    expect(getProjectTeacherInitials({ module_tutor_name: 'Professor Bob' })).toBe('BO');
    expect(getProjectTeacherInitials({ module_tutor_name: 'miss charlie' })).toBe('MC');
    expect(getProjectTeacherInitials({ module_tutor_name: 'Alice Smith' })).toBe('AS');
  });

  it('returns ML for empty or missing teacher names', () => {
    expect(getProjectTeacherInitials({ module_tutor_name: '' })).toBe('ML');
    expect(getProjectTeacherInitials({ module_tutor_name: null })).toBe('ML');
    expect(getProjectTeacherInitials({})).toBe('ML');
  });

  it('identifies honorific-only names and falls back to ML', () => {
    expect(getProjectTeacherInitials({ module_tutor_name: 'Dr.' })).toBe('ML');
    expect(getProjectTeacherInitials({ module_tutor_name: 'Professor' })).toBe('ML');
  });
});

describe('projectRowUtils – getProjectTeacherEmail', () => {
  it('resolves teacher email with priority', () => {
    expect(getProjectTeacherEmail({ module_tutor_email: 'a@b.com' })).toBe('a@b.com');
    expect(getProjectTeacherEmail({ module_tutor_name: 'Alice' })).toBe('');
    expect(getProjectTeacherEmail({ module_tutor_username: 'user1' })).toBe('');
    expect(getProjectTeacherEmail({})).toBe('');
  });
});

describe('projectRowUtils – getProjectTeacherName', () => {
  it('resolves teacher name with priority', () => {
    expect(getProjectTeacherName({ module_tutor_name: 'Alice' })).toBe('Alice');
    expect(getProjectTeacherName({ module_tutor_username: 'user1' })).toBe('user1');
    expect(getProjectTeacherName({})).toBe('Module lead');
  });
});

describe('projectRowUtils – getProjectTeacherPhoto', () => {
  it('resolves a teacher photo', () => {
    getProjectTeacherPhoto({ module_tutor_id: 1, module_tutor_username: 'a', module_tutor_name: 'b' });
    expect(getResolvedUserPhoto).toHaveBeenCalled();
  });

  it('passes the profile photo url through to the resolver', () => {
    getProjectTeacherPhoto({
      module_tutor_id: 1,
      module_tutor_username: 'a',
      module_tutor_name: 'b',
      module_tutor_profile_photo_url: 'https://example.com/t.jpg',
    });
    expect(getResolvedUserPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ profile_photo_url: 'https://example.com/t.jpg' }),
      expect.objectContaining({ allowGeneric: true }),
    );
  });
});

describe('projectRowUtils – openTeacherProfile', () => {
  let dispatched;

  beforeEach(() => {
    dispatched = [];
    vi.spyOn(window, 'dispatchEvent').mockImplementation((e) => dispatched.push(e));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches navigate event with correct detail', () => {
    openTeacherProfile({ stopPropagation: vi.fn() }, { module_tutor_id: 7 });
    expect(dispatched[0].detail).toBe('profile_7');
  });

  it('does nothing when the teacher id is missing', () => {
    openTeacherProfile({ stopPropagation: vi.fn() }, { module_tutor_id: null });
    expect(dispatched).toHaveLength(0);
  });
});

describe('projectRowUtils – compareProjectsBySort', () => {
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
  });

  it('uses completion and created-date tie breakers when member counts match', () => {
    const gamma = { name: 'Gamma', task_count: 4, completed_task_count: 1, members: [1, 2] };
    const delta = { name: 'Delta', task_count: 4, completed_task_count: 4, members: [3, 4] };
    expect(compareProjectsBySort(gamma, delta, 'least-members')).toBeGreaterThan(0);
    expect(compareProjectsBySort(
      { name: 'Gamma', created_at: '2026-02-01', deadline: '2026-03-05', members: [1, 2] },
      { name: 'Delta', created_at: '2026-02-01', deadline: '2026-03-10', members: [3, 4] },
      'created-asc',
    )).toBeLessThan(0);
  });

  it('covers all sorting types and tie breakers', () => {
    const a = { name: 'A', members: [1], completed_task_count: 5, task_count: 10, created_at: '2026-01-01', deadline: '2026-03-01' };
    const b = { name: 'B', members: [1, 2], completed_task_count: 2, task_count: 10, created_at: '2026-01-02', deadline: '2026-03-02' };

    expect(compareProjectsBySort(a, b, 'name')).toBeLessThan(0);
    expect(compareProjectsBySort(a, b, 'name-desc')).toBeGreaterThan(0);
    expect(compareProjectsBySort(a, b, 'least-members')).toBeLessThan(0);
    expect(compareProjectsBySort(a, b, 'most-members')).toBeGreaterThan(0);
    expect(compareProjectsBySort(a, b, 'least-completed')).toBeGreaterThan(0);
    expect(compareProjectsBySort(a, b, 'most-completed')).toBeLessThan(0);
    expect(compareProjectsBySort(a, b, 'created-asc')).toBeLessThan(0);
    expect(compareProjectsBySort(a, b, 'created-desc')).toBeGreaterThan(0);
    expect(compareProjectsBySort(a, b, 'due-date')).toBeLessThan(0);
  });

  it('uses completion and created-date tie breakers when member counts match', () => {
    const gamma = { name: 'Gamma', task_count: 10, completed_task_count: 5, members: [1, 2] };
    const delta = { name: 'Delta', task_count: 10, completed_task_count: 8, members: [3, 4] };
    expect(compareProjectsBySort(gamma, delta, 'least-members')).toBeGreaterThan(0);
    expect(compareProjectsBySort(gamma, delta, 'most-members')).toBeLessThan(0);

    const epsilon = { name: 'Epsilon', task_count: 10, completed_task_count: 5, members: [1, 2] };
    const zeta = { name: 'Zeta', task_count: 2, completed_task_count: 1, members: [3, 4] };
    expect(compareProjectsBySort(epsilon, zeta, 'least-members')).toBeLessThan(0);
  });

  it('handles missing dates and invalid values in created/deadline values', () => {
    const a = { name: 'A', created_at: null, deadline: null };
    const b = { name: 'B', created_at: '2026-01-01', deadline: '2026-01-01' };
    expect(compareProjectsBySort(a, b, 'created-asc')).toBeLessThan(0);
    expect(compareProjectsBySort(a, b, 'due-date')).toBeGreaterThan(0);
  });

  it('handles invalid dates in sorting tie breakers', () => {
    const a = { name: 'A', created_at: 'invalid', deadline: 'invalid' };
    const b = { name: 'B', created_at: 'invalid', deadline: 'invalid' };
    expect(compareProjectsBySort(a, b, 'created-asc')).toBeLessThan(0);
    expect(compareProjectsBySort({ name: 'A' }, { name: 'B', created_at: '2026-01-01' }, 'created-asc')).toBeLessThan(0);
  });

  it('uses tie breakers for identical member counts', () => {
    const a = { name: 'Match', members: [1], task_count: 10, completed_task_count: 5, deadline: '2026-03-01' };
    const b = { name: 'Match', members: [2], task_count: 10, completed_task_count: 5, deadline: '2026-03-10' };
    expect(compareProjectsBySort(a, b, 'most-members')).toBeGreaterThan(0);
  });

  it('covers name comparison with missing name fields', () => {
    expect(compareProjectsBySort({ name: null }, { name: 'B' }, 'name')).toBeLessThan(0);
    expect(compareProjectsBySort({ name: 'A' }, { name: null }, 'name')).toBeGreaterThan(0);
  });

  it('uses created date and deadline fallbacks when sorting', () => {
    expect(compareProjectsBySort(
      { name: 'Alpha', created_at: '2026-01-01', deadline: '2026-03-01', members: [] },
      { name: 'Beta', created_at: '2026-02-01', deadline: '2026-03-02', members: [] },
      'created-asc',
    )).toBeLessThan(0);
    expect(compareProjectsBySort(
      { name: 'Alpha', created_at: '2026-02-01', deadline: '2026-03-01', members: [] },
      { name: 'Beta', created_at: '2026-02-01', deadline: '2026-03-02', members: [] },
      'created-desc',
    )).toBeGreaterThan(0);
  });

  it('hits deep tie-breakers and default sort sequence', () => {
    const a = { name: 'A', task_count: 1, completed_task_count: 1, deadline: '2026-01-01' };
    const b = { name: 'B', task_count: 10, completed_task_count: 10, deadline: '2026-01-01' };
    expect(compareProjectsBySort(a, b, 'least-completed')).toBeLessThan(0);
    expect(compareProjectsBySort(a, b, 'unknown')).toBeGreaterThan(0);
    const c = { name: 'Match', deadline: '2010-01-01', task_count: 1, completed_task_count: 1 };
    const d = { name: 'Match', deadline: '2010-01-01', task_count: 1, completed_task_count: 1 };
    expect(compareProjectsBySort(c, d, 'unknown')).toBe(0);
  });

  it('hits the final name fallback in sorting tie-breaker', () => {
    const y = { name: 'Y', members: [1], task_count: 1, completed_task_count: 1, deadline: '2026-01-01' };
    const z = { name: 'Z', members: [2], task_count: 1, completed_task_count: 1, deadline: '2026-01-01' };
    expect(compareProjectsBySort(y, z, 'most-members')).toBeLessThan(0);
  });
});

describe('projectRowUtils – getVisibleMembers', () => {
  it('deduplicates members by various property keys and drops empty ones', () => {
    const m1 = { user: 'u1' };
    const m2 = { id: 'i1' };
    const m3 = { user_name: 'un1' };
    const m4 = { username: 'un2' };
    const m5 = { user: 'u1' };
    const m6 = { something: 'else' };
    const members = [m1, m2, m3, m4, m5, m6];
    const res = getVisibleMembers(members);
    expect(res).toHaveLength(4);
    expect(res[0].user).toBe('u1');
  });

  it('deduplicates project members', () => {
    const project = { members: [{ user: 1 }, { user: 1 }] };
    expect(getProjectMembers(project)).toHaveLength(1);
  });

  it('handles missing members on project', () => {
    expect(getProjectMembers({})).toHaveLength(0);
  });

  it('handles default members parameter', () => {
    expect(getVisibleMembers()).toHaveLength(0);
  });
});
