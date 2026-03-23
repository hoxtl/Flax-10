/*
 * Tests for GroupWork utility functions covering tasks, projects, availability, and members.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildToggleAssignee,
  filterVisibleAssignees,
  handleDragStartTask,
  getDueDateStr,
  formatTaskDueDate,
  getDeadlineLabel,
  sortTasks,
} from '../../../pages/GroupWork/utils/taskUtils';
import {
  calculateDays,
  getModulesCount,
  getNextDeadline,
  getCollaboratorCount,
  getProgressStats,
} from '../../../pages/GroupWork/utils/projectStatsUtils';
import {
  PRIORITY_COLORS,
  PRIORITY_OPTIONS,
  getPriorityStyle,
  getUserColor,
} from '../../../pages/GroupWork/utils/priorityUtils';
import {
  createPopupCoords,
  shouldShowPopupAbove,
} from '../../../pages/GroupWork/utils/taskAssigneeUtils';
import { buildBoardColumns } from '../../../pages/GroupWork/utils/taskBoardUtils';
import {
  formatSuggestionDateLabel,
  getMemberStatuses,
  getTeamSize,
  getSuggestionCount,
  getCurrentUserStatus,
} from '../../../pages/GroupWork/utils/availabilityUtils';
import {
  MEMBER_PALETTE,
  getInitials,
  getDisplayName,
  getMemberKey,
  buildMemberColorMap,
  getMemberColor,
  getProfileNavTarget,
  openMemberProfile,
  getStoredViewer,
} from '../../../pages/GroupWork/utils/memberAvatarUtils';
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
  openTeacherProfile,
  compareProjectsBySort,
  getProjectMembers,
  getVisibleMembers,
} from '../../../pages/GroupWork/utils/projectRowUtils';
import {
  WEEK_MS,
  DAY_MS,
  getTimelineAnchor,
  buildWeeks,
  placeTasksIntoWeeks,
} from '../../../pages/GroupWork/utils/taskTimelineUtils';
import { calcCompletionSegments } from '../../../pages/GroupWork/utils/taskStatsUtils';

vi.mock('../../../pages/GroupWork/utils/memberAvatarUtils', async (importOriginal) => {
  const actual = await importOriginal();
  return actual;
});

vi.mock('../../../utils/tutorPhotoFallback.js', () => ({
  getResolvedUserPhoto: vi.fn(() => 'https://example.com/photo.jpg'),
}));

vi.mock('../../../pages/GroupWork/components/TaskBoardView.module.css', () => ({
  default: {
    colTodo: 'colTodo', colTodoDot: 'colTodoDot', colTodoText: 'colTodoText',
    colInProgress: 'colInProgress', colInProgressDot: 'colInProgressDot', colInProgressText: 'colInProgressText',
    colDone: 'colDone', colDoneDot: 'colDoneDot', colDoneText: 'colDoneText',
  },
}));

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
});

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
    expect(getUserColor(null)).toBe('#7B6751');
  });

  it('returns a consistent colour for the same ID', () => {
    expect(getUserColor(42)).toBe(getUserColor(42));
  });
});

describe('taskAssigneeUtils – createPopupCoords', () => {
  it('positions popup below when showTop is false', () => {
    const rect = { top: 100, bottom: 120, left: 50 };
    const coords = createPopupCoords(rect, false);
    expect(coords.top).toBe(128);
    expect(coords.width).toBe(200);
  });

  it('positions popup above when showTop is true', () => {
    const rect = { top: 100, bottom: 120, left: 50 };
    expect(createPopupCoords(rect, true).top).toBe(92);
  });
});

describe('taskAssigneeUtils – shouldShowPopupAbove', () => {
  it('returns false when there is enough space below', () => {
    const rect = { top: 50, bottom: 100 };
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    expect(shouldShowPopupAbove(rect)).toBe(false);
  });
});

describe('taskBoardUtils – buildBoardColumns', () => {
  it('returns three columns with correct IDs', () => {
    const cols = buildBoardColumns([]);
    expect(cols.map((c) => c.id)).toEqual(['todo', 'in_progress', 'done']);
  });

  it('places tasks by status', () => {
    const tasks = [
      { id: 1, status: 'done' },
      { id: 2, status: 'in_progress' },
      { id: 3, status: 'todo' },
    ];
    const cols = buildBoardColumns(tasks);
    expect(cols.find((c) => c.id === 'done').tasks).toHaveLength(1);
    expect(cols.find((c) => c.id === 'in_progress').tasks).toHaveLength(1);
  });

  it('falls back to todo for unrecognised status', () => {
    const cols = buildBoardColumns([{ id: 1, status: 'unknown' }]);
    expect(cols.find((c) => c.id === 'todo').tasks).toHaveLength(1);
  });

  it('uses completed flag as fallback when status is absent', () => {
    const cols = buildBoardColumns([{ id: 1, completed: true }]);
    expect(cols.find((c) => c.id === 'done').tasks).toHaveLength(1);
  });
});

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

describe('memberAvatarUtils – MEMBER_PALETTE', () => {
  it('is an array of colour strings', () => {
    expect(Array.isArray(MEMBER_PALETTE)).toBe(true);
    expect(MEMBER_PALETTE.every((c) => c.startsWith('#'))).toBe(true);
  });
});

describe('memberAvatarUtils – getInitials', () => {
  it('returns initials from first_name and last_name', () => {
    expect(getInitials({ first_name: 'Alice', last_name: 'Brown' })).toBe('AB');
  });

  it('returns initials from user_name when names are absent', () => {
    expect(getInitials({ user_name: 'john doe' })).toBe('JD');
  });

  it('returns single character initial when only one name part', () => {
    expect(getInitials({ user_name: 'alice' })).toBe('A');
  });

  it('returns ? when member has no usable name', () => {
    expect(getInitials({})).toBe('?');
  });
});

describe('memberAvatarUtils – getDisplayName', () => {
  it('prefers first_name + last_name', () => {
    expect(getDisplayName({ first_name: 'Alice', last_name: 'Brown' })).toBe('Alice Brown');
  });

  it('falls back to user_name', () => {
    expect(getDisplayName({ user_name: 'alice_b' })).toBe('alice_b');
  });

  it('falls back to name field', () => {
    expect(getDisplayName({ name: 'Alice' })).toBe('Alice');
  });
});

describe('memberAvatarUtils – getMemberKey', () => {
  it('uses user field first', () => {
    expect(getMemberKey({ user: 5, id: 9 })).toBe('5');
  });

  it('falls back to id when user is absent', () => {
    expect(getMemberKey({ id: 9 })).toBe('9');
  });

  it('returns empty string for null/undefined member', () => {
    expect(getMemberKey(null)).toBe('');
  });
});

describe('memberAvatarUtils – buildMemberColorMap', () => {
  it('returns empty object for empty array', () => {
    expect(buildMemberColorMap([])).toEqual({});
  });

  it('assigns distinct colours to distinct members', () => {
    const members = [{ user: 1 }, { user: 2 }];
    const map = buildMemberColorMap(members);
    expect(map['1']).toBeDefined();
    expect(map['2']).toBeDefined();
    expect(map['1']).not.toBe(map['2']);
  });
});

describe('memberAvatarUtils – getMemberColor', () => {
  it('returns a palette colour string', () => {
    const members = [{ user: 1 }];
    const colour = getMemberColor({ user: 1 }, members);
    expect(MEMBER_PALETTE).toContain(colour);
  });

  it('returns first palette colour when member key is empty', () => {
    expect(getMemberColor({}, [])).toBe(MEMBER_PALETTE[0]);
  });
});

describe('memberAvatarUtils – getProfileNavTarget', () => {
  it('returns profile_{id} when user field is present', () => {
    expect(getProfileNavTarget({ user: 3 })).toBe('profile_3');
  });

  it('returns profile_{id} when id field is present', () => {
    expect(getProfileNavTarget({ id: 7 })).toBe('profile_7');
  });

  it('returns null when no ID field is present', () => {
    expect(getProfileNavTarget({})).toBeNull();
  });
});

describe('memberAvatarUtils – openMemberProfile', () => {
  let dispatched;

  beforeEach(() => {
    dispatched = [];
    vi.spyOn(window, 'dispatchEvent').mockImplementation((e) => dispatched.push(e));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches a navigate event with the correct detail', () => {
    openMemberProfile({ stopPropagation: vi.fn() }, { user: 5 });
    expect(dispatched[0].detail).toBe('profile_5');
  });

  it('does nothing when member has no ID', () => {
    openMemberProfile({}, {});
    expect(dispatched).toHaveLength(0);
  });
});

describe('memberAvatarUtils – getStoredViewer', () => {
  it('returns empty object when localStorage has no user', () => {
    window.localStorage.clear();
    expect(getStoredViewer()).toEqual({});
  });

  it('returns parsed user when localStorage has a user', () => {
    window.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'alice' }));
    expect(getStoredViewer()).toEqual({ id: 1, username: 'alice' });
  });
});

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

  it('returns "Due today" when days left is zero', () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const result = formatProjectCountdownText(today);
    expect(['Due today', '1 day left']).toContain(result);
  });

  it('returns overdue text for past dates', () => {
    expect(formatProjectCountdownText(new Date('2000-01-01'))).toContain('overdue');
  });
});

describe('projectRowUtils – getProjectCompletedCount', () => {
  it('returns the completed task count', () => {
    expect(getProjectCompletedCount({ completed_task_count: 3 })).toBe(3);
  });

  it('returns 0 for falsy input', () => {
    expect(getProjectCompletedCount({})).toBe(0);
  });
});

describe('projectRowUtils – getProjectRemainingCount', () => {
  it('returns the difference between total and completed tasks', () => {
    expect(getProjectRemainingCount({ task_count: 5, completed_task_count: 2 })).toBe(3);
  });

  it('never returns a negative number', () => {
    expect(getProjectRemainingCount({ task_count: 0, completed_task_count: 5 })).toBe(0);
  });
});

describe('projectRowUtils – getProjectCaption', () => {
  it('returns a poster caption for poster projects', () => {
    expect(getProjectCaption({ name: 'Biology Poster', module_name: 'Bio' })).toContain('poster');
  });

  it('returns a default caption when no keyword matches', () => {
    expect(getProjectCaption({ name: 'General Work', module_name: 'Misc' })).toContain('aligned');
  });
});

describe('projectRowUtils – getProjectTeacherName', () => {
  it('returns module_tutor_name when available', () => {
    expect(getProjectTeacherName({ module_tutor_name: 'Dr Smith' })).toBe('Dr Smith');
  });

  it('falls back to "Module lead" when no tutor info', () => {
    expect(getProjectTeacherName({})).toBe('Module lead');
  });
});

describe('projectRowUtils – getProjectTeacherInitials', () => {
  it('returns two-letter initials skipping honorifics', () => {
    expect(getProjectTeacherInitials({ module_tutor_name: 'Dr Alice Brown' })).toBe('AB');
  });

  it('returns ML when teacher name is empty', () => {
    expect(getProjectTeacherInitials({})).toBe('ML');
  });
});

describe('projectRowUtils – getProjectTeacherEmail', () => {
  it('returns module_tutor_email when present', () => {
    expect(getProjectTeacherEmail({ module_tutor_email: 'a@b.com' })).toBe('a@b.com');
  });

  it('returns empty string when absent', () => {
    expect(getProjectTeacherEmail({})).toBe('');
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

  it('does nothing when tutor ID is absent', () => {
    openTeacherProfile({}, {});
    expect(dispatched).toHaveLength(0);
  });
});

describe('projectRowUtils – compareProjectsBySort', () => {
  const alpha = { name: 'Alpha', task_count: 5, completed_task_count: 2, members: [1] };
  const beta = { name: 'Beta', task_count: 3, completed_task_count: 3, members: [1, 2] };

  it('sorts by name ascending', () => {
    expect(compareProjectsBySort(alpha, beta, 'name')).toBeLessThan(0);
  });

  it('sorts by name descending', () => {
    expect(compareProjectsBySort(alpha, beta, 'name-desc')).toBeGreaterThan(0);
  });

  it('applies default sort when sortBy is not recognised', () => {
    expect(typeof compareProjectsBySort(alpha, beta, 'unknown')).toBe('number');
  });
});

describe('projectRowUtils – getVisibleMembers', () => {
  it('deduplicates members by key', () => {
    const members = [{ user: 1 }, { user: 1 }, { user: 2 }];
    expect(getVisibleMembers(members)).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(getVisibleMembers([])).toHaveLength(0);
  });
});

describe('projectRowUtils – getProjectMembers', () => {
  it('deduplicates project members', () => {
    const project = { members: [{ user: 1 }, { user: 1 }] };
    expect(getProjectMembers(project)).toHaveLength(1);
  });
});

describe('taskTimelineUtils – constants', () => {
  it('WEEK_MS is seven days in milliseconds', () => {
    expect(WEEK_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('DAY_MS is one day in milliseconds', () => {
    expect(DAY_MS).toBe(24 * 60 * 60 * 1000);
  });
});

describe('taskTimelineUtils – getTimelineAnchor', () => {
  it('returns a Date set to midnight', () => {
    const anchor = getTimelineAnchor();
    expect(anchor).toBeInstanceOf(Date);
    expect(anchor.getHours()).toBe(0);
    expect(anchor.getMinutes()).toBe(0);
  });

  it('returns a Monday', () => {
    const anchor = getTimelineAnchor();
    expect(anchor.getDay()).toBe(1);
  });
});

describe('taskTimelineUtils – buildWeeks', () => {
  it('returns 9 week descriptors', () => {
    const anchor = getTimelineAnchor();
    expect(buildWeeks(anchor)).toHaveLength(9);
  });

  it('each week has id, label, startTs, endTs', () => {
    const weeks = buildWeeks(getTimelineAnchor());
    expect(weeks[0]).toHaveProperty('id', 0);
    expect(weeks[0]).toHaveProperty('label');
    expect(weeks[0]).toHaveProperty('startTs');
    expect(weeks[0]).toHaveProperty('endTs');
  });
});

describe('taskTimelineUtils – placeTasksIntoWeeks', () => {
  it('returns a layout object with a key for each week', () => {
    const anchor = getTimelineAnchor();
    const weeks = buildWeeks(anchor);
    const layout = placeTasksIntoWeeks([], weeks);
    expect(Object.keys(layout)).toHaveLength(9);
  });

  it('places a task into the correct week slot', () => {
    const anchor = getTimelineAnchor();
    const weeks = buildWeeks(anchor);
    const taskDate = new Date(weeks[0].startTs + DAY_MS);
    const task = { id: 1, due_date: taskDate.toISOString() };
    const layout = placeTasksIntoWeeks([task], weeks);
    const weekSlots = layout[0];
    const totalTasks = weekSlots.reduce((acc, day) => acc + day.length, 0);
    expect(totalTasks).toBe(1);
  });
});

describe('taskStatsUtils – calcCompletionSegments', () => {
  it('returns zeros for empty task list', () => {
    expect(calcCompletionSegments([], [])).toEqual({ percent: 0, completed: 0, total: 0, segments: [] });
  });

  it('calculates percentage from completed tasks', () => {
    const tasks = [
      { completed: true, assignees_info: [] },
      { completed: false, assignees_info: [] },
    ];
    const result = calcCompletionSegments(tasks, []);
    expect(result.percent).toBe(50);
    expect(result.completed).toBe(1);
    expect(result.total).toBe(2);
  });

  it('includes an unassigned segment when completed tasks have no assignees', () => {
    const tasks = [{ completed: true, assignees_info: [] }];
    const result = calcCompletionSegments(tasks, []);
    const unassigned = result.segments.find((s) => s.id === 'unassigned');
    expect(unassigned).toBeDefined();
  });

  it('builds per-user segments for assigned completed tasks', () => {
    const members = [{ user: '1', user_name: 'alice' }];
    const tasks = [
      { completed: true, assignees_info: [{ id: '1', name: 'alice' }] },
    ];
    const result = calcCompletionSegments(tasks, members);
    expect(result.segments.length).toBeGreaterThan(0);
  });
});
