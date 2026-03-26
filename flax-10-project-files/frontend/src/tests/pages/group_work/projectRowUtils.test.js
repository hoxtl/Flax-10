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
} from '../../../pages/group_work/utils/projectRowUtils';
import { getResolvedUserPhoto } from '../../../utils/tutorPhotoFallback.js';

vi.mock('../../../utils/tutorPhotoFallback.js', () => ({
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
});

describe('projectRowUtils – compareProjectsBySort', () => {
  const alpha = { name: 'Alpha', task_count: 5, completed_task_count: 2, members: [1] };
  const beta = { name: 'Beta', task_count: 3, completed_task_count: 3, members: [1, 2] };

  it('sorts by name ascending', () => {
    expect(compareProjectsBySort(alpha, beta, 'name')).toBeLessThan(0);
  });
});

describe('projectRowUtils – getVisibleMembers', () => {
  it('deduplicates members by key', () => {
    const members = [{ user: 1 }, { user: 1 }, { user: 2 }];
    expect(getVisibleMembers(members)).toHaveLength(2);
  });
});

describe('projectRowUtils – getProjectMembers', () => {
  it('deduplicates project members', () => {
    const project = { members: [{ user: 1 }, { user: 1 }] };
    expect(getProjectMembers(project)).toHaveLength(1);
  });
});
