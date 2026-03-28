import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../api/taskApi', () => ({
  fetchTasks: vi.fn(),
  fetchTaskLists: vi.fn(),
}));

vi.mock('../../../api/moduleApi', () => ({
  getModules: vi.fn(),
  getEnrollments: vi.fn(),
}));

vi.mock('../../../components/timer/task_input/taskInputUtils', () => ({
  buildListItems: vi.fn((lists) => lists.map((l) => ({ id: String(l.id), label: l.name }))),
  buildModuleItems: vi.fn((modules) => modules.map((m) => ({ value: m.code, label: m.name || m.code }))),
  filterListItems: vi.fn((items, query) => query ? items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())) : items),
  filterTasks: vi.fn((tasks, state) => state.search ? tasks.filter((task) => task.title.toLowerCase().includes(state.search.toLowerCase())) : tasks),
  getRecommendedTask: vi.fn((tasks) => tasks[0] || null),
  groupModuleItems: vi.fn((items) => items.reduce((acc, item) => ({ ...acc, [item.value.slice(0, 2)]: [...(acc[item.value.slice(0, 2)] || []), item] }), {})),
  hydrateTasks: vi.fn((tasks) => tasks),
  mapEnrolledModules: vi.fn(() => [{ code: 'CS', name: 'Computer Science' }]),
  sortTasks: vi.fn((tasks) => tasks),
}));

vi.mock('../../../components/timer/task_input/taskInputConstants', () => ({
  SORT_URGENCY: 'urgency',
}));

import { fetchTasks, fetchTaskLists } from '../../../api/taskApi';
import { getModules, getEnrollments } from '../../../api/moduleApi';
import { useTaskPickerData } from '../../../components/timer/task_input/useTaskPickerData';

const TASKS = [{ id: 1, title: 'Task A', completed: false }];
const LISTS = [{ id: 1, name: 'Work', color: '#000' }];

beforeEach(() => {
  vi.clearAllMocks();
  fetchTasks.mockResolvedValue(TASKS);
  fetchTaskLists.mockResolvedValue(LISTS);
  getModules.mockResolvedValue([]);
  getEnrollments.mockResolvedValue([]);
  try { sessionStorage.clear(); } catch {}
});

describe('useTaskPickerData – initial state', () => {
  it('starts with open=false', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(result.current.open).toBe(false);
  });

  it('starts with loading=false', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(result.current.loading).toBe(false);
  });

  it('starts with empty search string', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(result.current.search).toBe('');
  });

  it('starts with sortBy=urgency', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(result.current.sortBy).toBe('urgency');
  });

  it('starts with empty filterListIds', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(result.current.filterListIds).toEqual([]);
  });

  it('starts with empty filterModuleCodes', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(result.current.filterModuleCodes).toEqual([]);
  });

  it('starts with isFilterOpen=false', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(result.current.isFilterOpen).toBe(false);
  });

  it('starts with activeFilterTab=lists', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(result.current.activeFilterTab).toBe('lists');
  });

  it('exposes a ref object', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(result.current.ref).toBeDefined();
  });

  it('exposes a filterWrapRef object', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(result.current.filterWrapRef).toBeDefined();
  });

  it('exposes a loadTasks function', () => {
    const { result } = renderHook(() => useTaskPickerData());
    expect(typeof result.current.loadTasks).toBe('function');
  });
});

describe('useTaskPickerData – loadTasks', () => {
  it('sets tasks and lists after loadTasks resolves', async () => {
    const { result } = renderHook(() => useTaskPickerData());
    await act(async () => { await result.current.loadTasks(); });
    expect(result.current.tasks).toEqual(TASKS);
    expect(result.current.lists).toEqual(LISTS);
  });

  it('falls back to empty tasks array when fetchTasks rejects', async () => {
    fetchTasks.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useTaskPickerData());
    await act(async () => { await result.current.loadTasks(); });
    expect(result.current.tasks).toEqual([]);
  });

  it('sets loading=true then false during loadTasks', async () => {
    let resolveTask;
    fetchTasks.mockReturnValueOnce(new Promise((r) => { resolveTask = r; }));
    fetchTaskLists.mockResolvedValue(LISTS);

    const { result } = renderHook(() => useTaskPickerData());
    let promise;
    act(() => { promise = result.current.loadTasks(); });
    expect(result.current.loading).toBe(true);
    await act(async () => { resolveTask(TASKS); await promise; });
    expect(result.current.loading).toBe(false);
  });

  it('sets lists to empty array when fetchTaskLists returns null', async () => {
    fetchTaskLists.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useTaskPickerData());
    await act(async () => { await result.current.loadTasks(); });
    expect(result.current.lists).toEqual([]);
  });
});

describe('useTaskPickerData – state setters', () => {
  it('setOpen toggles the open flag', () => {
    const { result } = renderHook(() => useTaskPickerData());
    act(() => result.current.setOpen(true));
    expect(result.current.open).toBe(true);
  });

  it('setSearch updates the search value', () => {
    const { result } = renderHook(() => useTaskPickerData());
    act(() => result.current.setSearch('hello'));
    expect(result.current.search).toBe('hello');
  });

  it('setSortBy updates the sort value', () => {
    const { result } = renderHook(() => useTaskPickerData());
    act(() => result.current.setSortBy('due'));
    expect(result.current.sortBy).toBe('due');
  });

  it('setSelectedTaskId updates the selected task', () => {
    const { result } = renderHook(() => useTaskPickerData());
    act(() => result.current.setSelectedTaskId(42));
    expect(result.current.selectedTaskId).toBe(42);
  });

  it('setRecommendedTaskId updates the recommended task id', () => {
    const { result } = renderHook(() => useTaskPickerData());
    act(() => result.current.setRecommendedTaskId(99));
    expect(result.current.recommendedTaskId).toBe(99);
  });

  it('setFilterListIds updates the filter list ids', () => {
    const { result } = renderHook(() => useTaskPickerData());
    act(() => result.current.setFilterListIds(['1', '2']));
    expect(result.current.filterListIds).toEqual(['1', '2']);
  });

  it('setFilterModuleCodes updates the filter module codes', () => {
    const { result } = renderHook(() => useTaskPickerData());
    act(() => result.current.setFilterModuleCodes(['CS101']));
    expect(result.current.filterModuleCodes).toEqual(['CS101']);
  });

  it('setIsFilterOpen updates the filter open flag', () => {
    const { result } = renderHook(() => useTaskPickerData());
    act(() => result.current.setIsFilterOpen(true));
    expect(result.current.isFilterOpen).toBe(true);
  });

  it('setActiveFilterTab updates the active filter tab', () => {
    const { result } = renderHook(() => useTaskPickerData());
    act(() => result.current.setActiveFilterTab('modules'));
    expect(result.current.activeFilterTab).toBe('modules');
  });

  it('setFilterQuery updates the filter query', () => {
    const { result } = renderHook(() => useTaskPickerData());
    act(() => result.current.setFilterQuery('maths'));
    expect(result.current.filterQuery).toBe('maths');
  });
});

describe('useTaskPickerData – outside close', () => {
  it('closes the picker when a mousedown occurs outside the mounted ref element', () => {
    const { result } = renderHook(() => useTaskPickerData());
    const wrap = document.createElement('div');
    const outside = document.createElement('button');
    document.body.appendChild(wrap);
    document.body.appendChild(outside);
    result.current.ref.current = wrap;

    act(() => result.current.setOpen(true));
    act(() => {
      outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(result.current.open).toBe(false);

    wrap.remove();
    outside.remove();
  });

  it('keeps the picker open when the click lands inside the mounted ref element', () => {
    const { result } = renderHook(() => useTaskPickerData());
    const wrap = document.createElement('div');
    const inside = document.createElement('button');
    wrap.appendChild(inside);
    document.body.appendChild(wrap);
    result.current.ref.current = wrap;

    act(() => result.current.setOpen(true));
    act(() => {
      inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(result.current.open).toBe(true);

    wrap.remove();
  });

  it('does not add a mousedown listener when open is false', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    renderHook(() => useTaskPickerData());
    // open is false by default – listener should not be registered for mousedown
    const mousedownCalls = addSpy.mock.calls.filter(([evt]) => evt === 'mousedown');
    expect(mousedownCalls).toHaveLength(0);
    addSpy.mockRestore();
  });
});

describe('useTaskPickerData – enrolled modules', () => {
  it('calls getModules and getEnrollments on mount', async () => {
    renderHook(() => useTaskPickerData());
    await act(async () => {});
    expect(getModules).toHaveBeenCalled();
    expect(getEnrollments).toHaveBeenCalled();
  });

  it('derives visible filter items, grouped modules, and a recommended task', async () => {
    const { result } = renderHook(() => useTaskPickerData());

    await act(async () => {
      await result.current.loadTasks();
    });

    act(() => {
      result.current.setSearch('task');
      result.current.setFilterQuery('work');
    });

    expect(result.current.visibleListItems).toEqual([{ id: '1', label: 'Work' }]);
    expect(result.current.groupedModuleItems).toEqual({ CS: [{ value: 'CS', label: 'Computer Science' }] });
    expect(result.current.moduleGroupKeys).toEqual(['CS']);
    expect(result.current.filteredTasks).toEqual(TASKS);
    expect(result.current.recommendedTask).toEqual(TASKS[0]);
  });

  it('ignores outside-close clicks when the ref is not mounted', () => {
    const { result } = renderHook(() => useTaskPickerData());

    act(() => result.current.setOpen(true));
    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(result.current.open).toBe(true);
  });
});
