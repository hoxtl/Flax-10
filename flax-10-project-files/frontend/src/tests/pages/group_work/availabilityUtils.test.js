import { describe, it, expect } from 'vitest';
import {
  formatSuggestionDateLabel,
  getMemberStatuses,
  getTeamSize,
  getSuggestionCount,
  getCurrentUserStatus,
} from '../../../pages/group_work/utils/availabilityUtils';

describe('availabilityUtils – getMemberStatuses', () => {
  it('returns empty array when suggestion is null', () => {
    expect(getMemberStatuses(null)).toEqual([]);
  });

  it('returns the member_statuses array when present', () => {
    expect(getMemberStatuses({ member_statuses: [{ id: 1 }] })).toHaveLength(1);
  });
});

describe('availabilityUtils – getTeamSize', () => {
  it('returns team_size when set', () => {
    expect(getTeamSize({ team_size: 5 })).toBe(5);
  });

  it('falls back to member_statuses length', () => {
    expect(getTeamSize({ member_statuses: [1, 2, 3] })).toBe(3);
  });
});

describe('availabilityUtils – getSuggestionCount', () => {
  it('returns accepted_count when present', () => {
    expect(getSuggestionCount({ accepted_count: 3 }, 'accepted')).toBe(3);
  });

  it('counts members by status when _count field is absent', () => {
    const suggestion = { member_statuses: [{ status: 'accepted' }, { status: 'declined' }] };
    expect(getSuggestionCount(suggestion, 'accepted')).toBe(1);
  });
});

describe('availabilityUtils – getCurrentUserStatus', () => {
  it('returns the status from member_statuses when found', () => {
    const suggestion = { member_statuses: [{ id: 7, status: 'accepted' }] };
    expect(getCurrentUserStatus(suggestion, 7)).toBe('accepted');
  });

  it('returns "accepted" when user is the suggester', () => {
    const suggestion = { member_statuses: [], suggested_by: { id: 10 } };
    expect(getCurrentUserStatus(suggestion, 10)).toBe('accepted');
  });

  it('returns "pending" as default', () => {
    const suggestion = { member_statuses: [], suggested_by: { id: 99 } };
    expect(getCurrentUserStatus(suggestion, 1)).toBe('pending');
  });
});

describe('availabilityUtils – formatSuggestionDateLabel', () => {
  it('returns -- for null date', () => {
    expect(formatSuggestionDateLabel(null)).toBe('--');
  });

  it('returns a formatted date string', () => {
    const result = formatSuggestionDateLabel('2026-03-24');
    expect(result).toContain('24');
  });
});
