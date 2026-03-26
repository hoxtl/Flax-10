import { describe, it, expect, vi } from 'vitest';
import {
  buildToggleAssignee,
  filterVisibleAssignees,
  handleDragStartTask,
  getDueDateStr,
  formatTaskDueDate,
  getDeadlineLabel,
  sortTasks,
} from '../../../pages/group_work/utils/taskUtils';

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
    ];
    const sorted = sortTasks(tasks);
    expect(sorted[0].priority).toBe('urgent');
  });

  it('uses created_at as a final tie breaker', () => {
    const tasks = [
      { completed: false, priority: 'medium', created_at: '2026-01-02' },
      { completed: false, priority: 'medium', created_at: '2026-01-01' },
    ];
    const sorted = sortTasks(tasks);
    expect(sorted[0].created_at).toBe('2026-01-01');
  });
});
