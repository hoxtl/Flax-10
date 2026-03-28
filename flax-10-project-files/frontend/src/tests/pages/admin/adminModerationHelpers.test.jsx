import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCourseMeta, getCourseCursor } from '../../../pages/admin/components/CourseChangeRequestsTab.jsx';
import { getRatificationMeta, resolveRatification } from '../../../pages/admin/components/RatificationsTab.jsx';
import { removeReportsBySociety } from '../../../pages/admin/components/ReportedSocietiesTab.jsx';
import { approveRatification, rejectRatification } from '../../../api/adminApi';

vi.mock('../../../api/adminApi', () => ({
  approveRatification: vi.fn((id) => ({ approved: id })),
  rejectRatification: vi.fn((id) => ({ rejected: id })),
}));

describe('CourseChangeRequestsTab helpers', () => {
  it('formats course meta with and without a current course', () => {
    expect(getCourseMeta({ current_course: 'CS1', requested_course: 'CS2' })).toBe('CS1 → CS2');
    expect(getCourseMeta({ current_course: null, requested_course: 'CS9' })).toBe('Requesting: CS9');
  });

  it('uses pointer cursor only when a user_id exists', () => {
    expect(getCourseCursor({ user_id: 3 })).toBe('pointer');
    expect(getCourseCursor({ user_id: null })).toBe('default');
  });
});

describe('RatificationsTab helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formats meta with member count and description snippet', () => {
    const meta = getRatificationMeta({ member_count: 42, description: 'A new theatre society that focuses on improvisation workshops.' });
    expect(meta).toContain('42 members');
    expect(meta).toContain('improvisation workshops');
  });

  it('falls back to zero members when count is missing', () => {
    expect(getRatificationMeta({ description: '' })).toBe('0 members');
  });

  it('truncates long descriptions and keeps short labels with ellipsis', () => {
    const meta = getRatificationMeta({ member_count: 2, description: 'x'.repeat(90) });
    expect(meta).toContain('…');
    expect(meta).toContain('2 members');
    expect(getRatificationMeta({ description: 'Short' })).toBe('0 members · Short…');
  });

  it('resolves approve and reject actions via admin API helpers', () => {
    const approveResult = resolveRatification('soc-1', 'approve');
    const rejectResult = resolveRatification('soc-2', 'reject');

    expect(approveRatification).toHaveBeenCalledWith('soc-1');
    expect(rejectRatification).toHaveBeenCalledWith('soc-2');
    expect(approveResult).toEqual({ approved: 'soc-1' });
    expect(rejectResult).toEqual({ rejected: 'soc-2' });
  });
});

describe('ReportedSocietiesTab helpers', () => {
  const sampleReports = [
    { id: 1, society_id: 'alpha' },
    { id: 2, society_id: 'alpha' },
    { id: 3, society_id: 'beta' },
  ];

  it('removes every report tied to the same society when a match is found', () => {
    const remaining = removeReportsBySociety(sampleReports, 1);
    expect(remaining).toEqual([{ id: 3, society_id: 'beta' }]);
  });

  it('removes only the targeted report id when society match is missing', () => {
    const remaining = removeReportsBySociety(sampleReports, 999);
    expect(remaining).toEqual(sampleReports);
  });

  it('removes all rows for a society when the report id matches', () => {
    const rows = [
      { id: 1, society_id: 10 },
      { id: 2, society_id: 10 },
      { id: 3, society_id: 20 },
    ];
    expect(removeReportsBySociety(rows, 1)).toEqual([{ id: 3, society_id: 20 }]);
  });

  it('filters by report id when the target row is not found by id', () => {
    const rows = [{ id: 5, society_id: 99 }];
    expect(removeReportsBySociety(rows, 5)).toEqual([]);
    expect(removeReportsBySociety(rows, 999)).toEqual(rows);
  });
});
