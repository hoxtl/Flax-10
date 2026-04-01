/*
 * Tests for projectRowUtils: teacher helpers, openTeacherProfile, compareProjectsBySort, and member utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
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

describe('projectRowUtils – compareProjectsBySort (advanced)', () => {
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
    expect(compareProjectsBySort(a, b, 'due-date-desc')).toBeGreaterThan(0);
  });

  it('uses completion and tie breakers with differing member counts', () => {
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

  it('uses completion and final name fallbacks for due-date-desc', () => {
    expect(compareProjectsBySort(
      { name: 'Alpha', deadline: '2026-03-01', task_count: 10, completed_task_count: 2 },
      { name: 'Beta', deadline: '2026-03-01', task_count: 10, completed_task_count: 8 },
      'due-date-desc',
    )).toBeGreaterThan(0);

    expect(compareProjectsBySort(
      { name: 'Match', deadline: '2026-03-01', task_count: 10, completed_task_count: 5 },
      { name: 'Match', deadline: '2026-03-01', task_count: 10, completed_task_count: 5 },
      'due-date-desc',
    )).toBe(0);
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
    const res = getVisibleMembers([m1, m2, m3, m4, m5, m6]);
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
