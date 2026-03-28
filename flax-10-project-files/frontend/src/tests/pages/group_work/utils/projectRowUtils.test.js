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
});

describe('projectRowUtils – formatProjectHeadlineDate', () => {
  it('returns -- for null date', () => {
    expect(formatProjectHeadlineDate(null)).toBe('--');
  });

  it('returns a string with ordinal day', () => {
    const result = formatProjectHeadlineDate(new Date('2026-03-24'));
    expect(result).toContain('24th');
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
    expect(formatProjectCountdownText(new Date('2000-01-01'))).toContain('overdue');
  });
});

describe('projectRowUtils – getProjectCompletedCount', () => {
  it('returns the completed task count', () => {
    expect(getProjectCompletedCount({ completed_task_count: 3 })).toBe(3);
  });
});

describe('projectRowUtils – getProjectRemainingCount', () => {
  it('returns the difference between total and completed tasks', () => {
    expect(getProjectRemainingCount({ task_count: 5, completed_task_count: 2 })).toBe(3);
  });
});

describe('projectRowUtils – getProjectCaption', () => {
  it('returns a poster caption for poster projects', () => {
    expect(getProjectCaption({ name: 'Biology Poster', module_name: 'Bio' })).toContain('poster');
  });

  it('falls back to the generic caption when no keywords match', () => {
    expect(getProjectCaption({ name: 'Weekly sync', module_name: 'History' })).toContain('Keep the team aligned');
  });
});

describe('projectRowUtils – getProjectTeacherName', () => {
  it('prefers module_tutor_name', () => {
    expect(getProjectTeacherName({ module_tutor_name: 'Dr Smith' })).toBe('Dr Smith');
  });
});

describe('projectRowUtils – getProjectTeacherInitials', () => {
  it('returns initials skipping honorifics', () => {
    expect(getProjectTeacherInitials({ module_tutor_name: 'Dr Alice Brown' })).toBe('AB');
  });

  it('falls back to ML when the teacher name is empty', () => {
    expect(getProjectTeacherInitials({ module_tutor_name: '' })).toBe('ML');
  });
});

describe('projectRowUtils – getProjectTeacherEmail', () => {
  it('returns email when present', () => {
    expect(getProjectTeacherEmail({ module_tutor_email: 'a@b.com' })).toBe('a@b.com');
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
    expect(compareProjectsBySort(
      { name: 'Alpha', members: [] },
      { name: 'Beta', members: [] },
      'unknown-sort',
    )).toBeGreaterThan(0);
  });
});

describe('projectRowUtils – getVisibleMembers', () => {
  it('deduplicates members by key', () => {
    const members = [{ user: 1 }, { user: 1 }, { user: 2 }];
    expect(getVisibleMembers(members)).toHaveLength(2);
  });

  it('deduplicates by username fallback and drops blank keys', () => {
    const members = [{ username: 'alex' }, { user_name: 'alex' }, { id: null }];
    expect(getVisibleMembers(members)).toHaveLength(1);
  });
});

describe('projectRowUtils – getProjectMembers', () => {
  it('deduplicates project members', () => {
    const project = { members: [{ user: 1 }, { user: 1 }] };
    expect(getProjectMembers(project)).toHaveLength(1);
  });
});
