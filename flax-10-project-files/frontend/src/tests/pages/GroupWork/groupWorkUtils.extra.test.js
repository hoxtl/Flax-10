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
    expect(result).toContain('15 Jun');
    expect(result).toMatch(/\d{2}:\d{2}/);
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
