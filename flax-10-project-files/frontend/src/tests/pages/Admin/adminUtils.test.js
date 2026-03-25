/*
 * Tests for admin utility functions: motion constants, navigation, user filters, and user state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fadeUp, rowAnim, stagger } from '../../../pages/Admin/utils/adminMotion';
import { emitAdminNavigation, navigateToSociety, navigateToProfile } from '../../../pages/Admin/utils/adminNavigation';
import {
  toggleArrayValue,
  createEmptyUserFilters,
  hasActiveUserFilters,
  matchesRoleFilter,
  matchesStatusFilter,
  matchesAllUserFilters,
  matchesUserSearch,
  filterUsers,
} from '../../../pages/Admin/utils/userFilters';
import { banUserState, unbanUserState } from '../../../pages/Admin/utils/userState';

describe('adminMotion', () => {
  it('fadeUp has correct initial, animate, exit, and transition values', () => {
    expect(fadeUp.initial).toEqual({ opacity: 0, y: 18 });
    expect(fadeUp.animate).toEqual({ opacity: 1, y: 0 });
    expect(fadeUp.exit).toEqual({ opacity: 0, y: -12 });
    expect(fadeUp.transition).toEqual({ duration: 0.28, ease: 'easeOut' });
  });

  it('rowAnim has correct initial, animate, exit, and transition values', () => {
    expect(rowAnim.initial).toEqual({ opacity: 0, x: -10 });
    expect(rowAnim.animate).toEqual({ opacity: 1, x: 0 });
    expect(rowAnim.exit).toEqual({ opacity: 0, x: 10 });
    expect(rowAnim.transition).toEqual({ duration: 0.2 });
  });

  it('stagger has animate with staggerChildren', () => {
    expect(stagger.animate.transition.staggerChildren).toBe(0.055);
  });
});

describe('adminNavigation', () => {
  let dispatchedEvents;

  beforeEach(() => {
    dispatchedEvents = [];
    vi.spyOn(window, 'dispatchEvent').mockImplementation((event) => {
      dispatchedEvents.push(event);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emitAdminNavigation dispatches a navigate custom event with the given detail', () => {
    emitAdminNavigation('societies_42');
    expect(dispatchedEvents).toHaveLength(1);
    expect(dispatchedEvents[0].type).toBe('navigate');
    expect(dispatchedEvents[0].detail).toBe('societies_42');
  });

  it('navigateToSociety dispatches navigate event with societies_{id} detail', () => {
    navigateToSociety(5);
    expect(dispatchedEvents[0].detail).toBe('societies_5');
  });

  it('navigateToProfile calls onNavigate with profile_{id}', () => {
    const onNavigate = vi.fn();
    navigateToProfile(onNavigate, 99);
    expect(onNavigate).toHaveBeenCalledWith('profile_99');
  });

  it('navigateToProfile does not throw when onNavigate is undefined', () => {
    expect(() => navigateToProfile(undefined, 1)).not.toThrow();
  });
});

describe('userFilters – toggleArrayValue', () => {
  it('adds a value not yet in the array', () => {
    expect(toggleArrayValue(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });

  it('removes a value already in the array', () => {
    expect(toggleArrayValue(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });
});

describe('userFilters – createEmptyUserFilters', () => {
  it('returns an object with empty roles and status arrays', () => {
    expect(createEmptyUserFilters()).toEqual({ roles: [], status: [] });
  });
});

describe('userFilters – hasActiveUserFilters', () => {
  it('returns false when all arrays are empty', () => {
    expect(hasActiveUserFilters({ roles: [], status: [] })).toBe(false);
  });

  it('returns true when any array has entries', () => {
    expect(hasActiveUserFilters({ roles: ['student'], status: [] })).toBe(true);
  });
});

describe('userFilters – matchesRoleFilter', () => {
  it('returns true when roles is empty (no filter active)', () => {
    expect(matchesRoleFilter({ role: 'student' }, [])).toBe(true);
  });

  it('matches student role', () => {
    expect(matchesRoleFilter({ role: 'student' }, ['student'])).toBe(true);
  });

  it('matches teacher role', () => {
    expect(matchesRoleFilter({ role: 'teacher' }, ['teacher'])).toBe(true);
  });

  it('matches pending_teacher under teacher filter', () => {
    expect(matchesRoleFilter({ role: 'pending_teacher' }, ['teacher'])).toBe(true);
  });

  it('does not match student against teacher filter', () => {
    expect(matchesRoleFilter({ role: 'student' }, ['teacher'])).toBe(false);
  });
});

describe('userFilters – matchesStatusFilter', () => {
  it('returns true when status array is empty', () => {
    expect(matchesStatusFilter({ is_active: false }, [])).toBe(true);
  });

  it('matches active user', () => {
    expect(matchesStatusFilter({ is_active: true }, ['active'])).toBe(true);
  });

  it('matches banned user', () => {
    expect(matchesStatusFilter({ is_active: false }, ['banned'])).toBe(true);
  });

  it('does not match active user against banned filter', () => {
    expect(matchesStatusFilter({ is_active: true }, ['banned'])).toBe(false);
  });
});

describe('userFilters – matchesAllUserFilters', () => {
  const user = { role: 'student', is_active: true, is_staff: false };

  it('returns true when all filters are empty', () => {
    expect(matchesAllUserFilters(user, createEmptyUserFilters())).toBe(true);
  });

  it('returns false when role filter excludes the user', () => {
    expect(matchesAllUserFilters(user, { roles: ['teacher'], status: [] })).toBe(false);
  });
});

describe('userFilters – matchesUserSearch', () => {
  const user = { username: 'jdoe', email: 'j@test.com', first_name: 'John', last_name: 'Doe' };

  it('matches by username', () => {
    expect(matchesUserSearch(user, 'jdoe')).toBe(true);
  });

  it('matches by email', () => {
    expect(matchesUserSearch(user, 'j@test.com')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matchesUserSearch(user, 'JOHN')).toBe(true);
  });

  it('returns false for non-matching search', () => {
    expect(matchesUserSearch(user, 'zzz')).toBe(false);
  });
});

describe('userFilters – filterUsers', () => {
  const users = [
    { id: 1, username: 'alice', email: 'a@x.com', first_name: 'Alice', last_name: 'A', role: 'student', is_active: true },
    { id: 2, username: 'bob', email: 'b@x.com', first_name: 'Bob', last_name: 'B', role: 'teacher', is_active: false },
  ];

  it('returns all users when search is empty and filters are empty', () => {
    expect(filterUsers(users, '', createEmptyUserFilters())).toHaveLength(2);
  });

  it('filters by search term', () => {
    expect(filterUsers(users, 'alice', createEmptyUserFilters())).toHaveLength(1);
  });

  it('filters by role', () => {
    const result = filterUsers(users, '', { roles: ['teacher'], status: [] });
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('bob');
  });
});

describe('userState', () => {
  const users = [
    { id: 1, username: 'alice', is_active: true, ban_reason: '' },
    { id: 2, username: 'bob', is_active: true, ban_reason: '' },
  ];

  it('banUserState sets is_active false and stores the ban reason', () => {
    const result = banUserState(users, 1, 'Spam');
    expect(result[0].is_active).toBe(false);
    expect(result[0].ban_reason).toBe('Spam');
    expect(result[1]).toBe(users[1]);
  });

  it('unbanUserState sets is_active true and clears the ban reason', () => {
    const banned = banUserState(users, 1, 'Spam');
    const result = unbanUserState(banned, 1);
    expect(result[0].is_active).toBe(true);
    expect(result[0].ban_reason).toBe('');
  });

  it('does not mutate the original users array', () => {
    banUserState(users, 1, 'Test');
    expect(users[0].is_active).toBe(true);
  });
});
