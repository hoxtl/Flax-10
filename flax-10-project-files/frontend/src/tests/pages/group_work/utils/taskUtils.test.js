import { describe, it, expect, vi } from 'vitest';
import {
  buildToggleAssignee,
  filterVisibleAssignees,
  handleDragStartTask,
  getDueDateStr,
  formatTaskDueDate,
  getDeadlineLabel,
  sortTasks,
} from '../../../../pages/group_work/utils/taskUtils';

describe('taskUtils – buildToggleAssignee', () => {
  it('adds a user not currently assigned', () => {
    const onUpdate = vi.fn();
    const toggle = buildToggleAssignee([{ id: 1 }], 'task-1', onUpdate);
    toggle(2);
    expect(onUpdate).toHaveBeenCalledWith('task-1', { assigned_to: [1, 2] });
  });

  it('removes a user already assigned', () => {
    const onUpdate = vi.fn();
    const toggle = buildToggleAssignee([{ id: 1 }, { id: 2 }], 'task-1', onUpdate);
    toggle(1);
    expect(onUpdate).toHaveBeenCalledWith('task-1', { assigned_to: [2] });
  });
});

describe('taskUtils – filterVisibleAssignees', () => {
  it('returns original assignees when either input is not an array', () => {
    expect(filterVisibleAssignees(null, [])).toEqual([]);
    expect(filterVisibleAssignees([{ id: 1 }], null)).toEqual([{ id: 1 }]);
  });

  it('filters to only members in the project', () => {
    const assignees = [{ id: 1 }, { id: 99 }];
    const members = [{ user: 1, user_name: 'alice' }];
    const result = filterVisibleAssignees(assignees, members);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

describe('taskUtils – handleDragStartTask', () => {
  it('sets task id on dataTransfer', () => {
    const setData = vi.fn();
    handleDragStartTask({ dataTransfer: { setData } }, 42);
    expect(setData).toHaveBeenCalledWith('text/plain', '42');
  });
});

describe('taskUtils – getDueDateStr', () => {
  it('returns empty string for falsy input', () => {
    expect(getDueDateStr(null)).toBe('');
  });

  it('returns YYYY-MM-DD slice of ISO string', () => {
    expect(getDueDateStr('2026-03-24T10:00:00Z')).toBe('2026-03-24');
  });
});

describe('taskUtils – formatTaskDueDate', () => {
  it('returns empty string for falsy input', () => {
    expect(formatTaskDueDate('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatTaskDueDate('not-a-date')).toBe('');
  });
});

describe('taskUtils – getDeadlineLabel', () => {
  it('returns null for falsy input', () => {
    expect(getDeadlineLabel(null)).toBeNull();
  });

  it('returns null for invalid date', () => {
    expect(getDeadlineLabel('bad-date')).toBeNull();
  });

  it('returns "Past due" for past dates', () => {
    expect(getDeadlineLabel('2000-01-01')).toBe('Past due');
  });

  it('returns a locale date string for far future deadlines', () => {
    expect(getDeadlineLabel('2099-01-01')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('returns "Due today" when diffDays is zero', () => {
    const today = new Date();
    const result = getDeadlineLabel(today.toISOString());
    expect(result).toBe('Due today');
  });
});

describe('taskUtils – sortTasks', () => {
  it('places incomplete tasks before completed ones', () => {
    const tasks = [
      { completed: true, priority: 'high', created_at: '2026-01-01' },
      { completed: false, priority: 'low', created_at: '2026-01-02' },
    ];
    const sorted = sortTasks(tasks);
    expect(sorted[0].completed).toBe(false);
  });

  it('sorts by priority when completion is equal', () => {
    const tasks = [
      { completed: false, priority: 'low', created_at: '2026-01-01' },
      { completed: false, priority: 'urgent', created_at: '2026-01-01' },
      { completed: false, priority: null, created_at: '2026-01-02' },
    ];
    const sorted = sortTasks(tasks);
    expect(sorted[0].priority).toBe('urgent');
    expect(sorted[1].priority).toBe(null);
    expect(sorted[2].priority).toBe('low');
  });

  it('covers all status differences in sort', () => {
    const tasks = [
      { id: 1, completed: true, priority: 'high', created_at: '2026-01-01' },
      { id: 2, completed: false, priority: 'low', created_at: '2026-01-01' },
    ];
    // a=true, b=false -> returns 1
    expect(sortTasks(tasks)[0].id).toBe(2);
    // a=false, b=true -> returns -1
    expect(sortTasks([...tasks].reverse())[0].id).toBe(2);
  });

  it('falls back to zero for unknown and missing priorities', () => {
    const tasks = [
      { completed: false, priority: 'invalid', id: 1 },
      { completed: false, priority: null, id: 2 },
      { completed: false, priority: 'low', id: 3 },
    ];
    // invalid (0), null (2 - medium), low (1)
    const sorted = sortTasks(tasks);
    expect(sorted[0].id).toBe(2); // medium (2)
    expect(sorted[1].id).toBe(3); // low (1)
    expect(sorted[2].id).toBe(1); // invalid (0)
  });

  it('covers both wA and wB priority fallbacks in comparisons', () => {
    // a null (med=2), b invalid (0) -> returns 2
    expect(sortTasks([{ priority: null, id: 1 }, { priority: 'invalid', id: 2 }])[0].id).toBe(1);
    // a invalid (0), b null (med=2) -> returns -2
    expect(sortTasks([{ priority: 'invalid', id: 1 }, { priority: null, id: 2 }])[0].id).toBe(2);
  });
});
