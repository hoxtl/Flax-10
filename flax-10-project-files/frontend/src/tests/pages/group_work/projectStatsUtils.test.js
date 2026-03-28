import { describe, it, expect } from 'vitest';
import {
  calculateDays,
  getModulesCount,
  getNextDeadline,
  getCollaboratorCount,
  getProgressStats,
} from '../../../pages/group_work/utils/projectStatsUtils';
import {
  PRIORITY_COLORS,
  PRIORITY_OPTIONS,
  getPriorityStyle,
  getUserColor,
} from '../../../pages/group_work/utils/priorityUtils';
import { calcCompletionSegments } from '../../../pages/group_work/utils/taskStatsUtils';

describe('projectStatsUtils – calculateDays', () => {
  it('returns null for falsy target', () => {
    expect(calculateDays(null)).toBeNull();
  });

  it('returns null for past dates', () => {
    expect(calculateDays('2000-01-01')).toBeNull();
  });

  it('returns a non-negative number for future dates', () => {
    expect(calculateDays('2099-01-01')).toBeGreaterThanOrEqual(0);
  });
});

describe('projectStatsUtils – getModulesCount', () => {
  it('returns distinct course code count', () => {
    const projects = [
      { course_code: 'CS101' }, { course_code: 'CS101' }, { course_code: 'MATH200' },
    ];
    expect(getModulesCount(projects)).toBe(2);
  });

  it('ignores falsy course codes', () => {
    expect(getModulesCount([{ course_code: null }, { course_code: '' }])).toBe(0);
  });
});

describe('projectStatsUtils – getNextDeadline', () => {
  it('returns null project when no projects have upcoming deadlines', () => {
    expect(getNextDeadline([{ deadline: '2000-01-01' }]).project).toBeNull();
  });

  it('returns the project with the nearest upcoming deadline', () => {
    const near = { name: 'Near', deadline: '2099-01-01' };
    const far = { name: 'Far', deadline: '2099-12-31' };
    expect(getNextDeadline([far, near]).project.name).toBe('Near');
  });
});

describe('projectStatsUtils – getCollaboratorCount', () => {
  it('sums members arrays across projects', () => {
    const projects = [
      { members: [1, 2] }, { members: [3] },
    ];
    expect(getCollaboratorCount(projects)).toBe(3);
  });

  it('falls back to member_count when members is absent', () => {
    expect(getCollaboratorCount([{ member_count: 5 }])).toBe(5);
  });
});

describe('projectStatsUtils – getProgressStats', () => {
  it('returns zero percent when there are no tasks', () => {
    expect(getProgressStats([{ task_count: 0, completed_task_count: 0 }]).percent).toBe(0);
  });

  it('computes percentage correctly', () => {
    const result = getProgressStats([{ task_count: 4, completed_task_count: 2 }]);
    expect(result.percent).toBe(50);
    expect(result.completed).toBe(2);
    expect(result.total).toBe(4);
  });
});

describe('priorityUtils – PRIORITY_COLORS', () => {
  it('contains entries for urgent, high, medium, and low', () => {
    expect(Object.keys(PRIORITY_COLORS)).toEqual(['urgent', 'high', 'medium', 'low']);
  });
});

describe('priorityUtils – PRIORITY_OPTIONS', () => {
  it('contains all four priority levels', () => {
    expect(PRIORITY_OPTIONS).toEqual(['urgent', 'high', 'medium', 'low']);
  });
});

describe('priorityUtils – getPriorityStyle', () => {
  it('returns the correct colour object for a known priority', () => {
    expect(getPriorityStyle('urgent')).toBe(PRIORITY_COLORS.urgent);
  });

  it('defaults to low when priority is unknown', () => {
    expect(getPriorityStyle('unknown')).toBe(PRIORITY_COLORS.low);
  });

  it('defaults to low when priority is falsy', () => {
    expect(getPriorityStyle(null)).toBe(PRIORITY_COLORS.low);
  });
});

describe('priorityUtils – getUserColor', () => {
  it('returns a string for a numeric user ID', () => {
    expect(typeof getUserColor(1)).toBe('string');
  });

  it('returns the first palette colour when userId is falsy', () => {
    expect(typeof getUserColor(null)).toBe('string');
    expect(getUserColor(null).length).toBeGreaterThan(0);
  });

  it('returns a consistent colour for the same ID', () => {
    expect(getUserColor(42)).toBe(getUserColor(42));
  });
});

describe('taskStatsUtils', () => {
  it('handles empty task list', () => {
    expect(calcCompletionSegments([], [])).toEqual({ percent: 0, completed: 0, total: 0, segments: [] });
  });

  it('calculates completion segments correctly', () => {
    const tasks = [{ completed: true }, { completed: false }, { completed: true }];
    const result = calcCompletionSegments(tasks, []);
    expect(result.completed).toBe(2);
    expect(result.total).toBe(3);
    expect(result.percent).toBe(67);
    expect(result.segments).toEqual([
      expect.objectContaining({
        id: "unassigned",
        percentage: expect.closeTo((2 / 3) * 100, 5),
      }),
    ]);
  });

  it('handles sorting segments for members missing from the members list', () => {
    const tasks = [
      { completed: true, assignees_info: [{ id: 999, name: "Missing" }] },
      { completed: true, assignees_info: [{ id: 1, name: "Alice" }] },
    ];
    const members = [{ id: 1, user_name: "Alice" }];
    const result = calcCompletionSegments(tasks, members);
    expect(result.segments[0].id).toBe(1);
    expect(result.segments[1].id).toBe(999);
    const singleTask = [{ completed: true, assignees_info: [{ id: 888 }] }];
    const singleResult = calcCompletionSegments(singleTask, []);
    expect(singleResult.segments[0].id).toBe(888);
    const multiTask = [
      { completed: true, assignees_info: [{ id: 888 }] },
      { completed: true, assignees_info: [{ id: 777 }] },
    ];
    const multiResult = calcCompletionSegments(multiTask, []);
    expect(multiResult.segments).toHaveLength(2);
  });

  it('covers tooltip pluralization and unassigned segments', () => {
    const tasks = [
      { completed: true, assignees_info: [{ id: 1, name: 'Alice' }] },
      { completed: true, assignees_info: [{ id: 2, name: 'Bob' }] },
      { completed: true, assignees_info: [{ id: 2, name: 'Bob' }] },
      { completed: true, assignees_info: [] },
      { completed: true, assignees_info: [] },
    ];
    const members = [{ id: 1, user_name: 'Alice' }, { id: 2, user_name: 'Bob' }];
    const res = calcCompletionSegments(tasks, members);

    expect(res.segments.find(s => s.id === 1).tooltip).toContain('1 task completed');
    expect(res.segments.find(s => s.id === 2).tooltip).toContain('2 tasks completed');
    expect(res.segments.find(s => s.id === 'unassigned').tooltip).toContain('2 tasks completed');
  });
});
