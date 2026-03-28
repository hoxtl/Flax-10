import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../api/taskApi', () => ({
  fetchTasks: vi.fn(),
}));

vi.mock('../../../../lib/focusPlanner', () => ({
  rankTasksForFocus: vi.fn((tasks) => tasks),
}));

vi.mock('../../../../components/timer/utils/presetUtils', () => ({
  applyTaskToTimer: vi.fn(),
}));

import { fetchTasks } from '../../../../api/taskApi';
import { rankTasksForFocus } from '../../../../lib/focusPlanner';
import { applyTaskToTimer } from '../../../../components/timer/utils/presetUtils';
import {
  clearManualTask,
  startManualTask,
  startSuggestedTask,
} from '../../../../components/timer/utils/timerTaskActions';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('clearManualTask', () => {
  it('calls setActiveTaskId(null) when it is a function', () => {
    const t = { setActiveTaskId: vi.fn() };
    clearManualTask(t);
    expect(t.setActiveTaskId).toHaveBeenCalledWith(null);
  });

  it('does nothing when setActiveTaskId is not a function', () => {
    expect(() => clearManualTask({})).not.toThrow();
    expect(() => clearManualTask({ setActiveTaskId: null })).not.toThrow();
  });
});

describe('startManualTask', () => {
  it('calls setIsActive(true) when task title is empty', () => {
    const t = { task: '', setIsActive: vi.fn() };
    startManualTask(t);
    expect(t.setIsActive).toHaveBeenCalledWith(true);
  });

  it('calls setIsActive(true) when task title is whitespace only', () => {
    const t = { task: '   ', setIsActive: vi.fn() };
    startManualTask(t);
    expect(t.setIsActive).toHaveBeenCalledWith(true);
  });

  it('calls setActiveTaskId(null, meta) when title is non-empty', () => {
    const t = {
      task: 'My Task',
      setIsActive: vi.fn(),
      setActiveTaskId: vi.fn(),
      activeTaskMeta: { moduleCode: 'CS101', dueDate: '2026-03-30', listName: 'Work', estimatedBlocks: 2 },
      targetSessions: 3,
      workTime: 30,
    };
    startManualTask(t);
    expect(t.setActiveTaskId).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ title: 'My Task', moduleCode: 'CS101', estimatedBlocks: 2 }),
    );
    expect(t.setIsActive).toHaveBeenCalledWith(true);
  });

  it('uses fallback values when activeTaskMeta is absent', () => {
    const t = {
      task: 'Quick note',
      setIsActive: vi.fn(),
      setActiveTaskId: vi.fn(),
      activeTaskMeta: null,
      targetSessions: 1,
      workTime: 25,
    };
    startManualTask(t);
    expect(t.setActiveTaskId).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ listName: 'Quick task', estimatedBlocks: 1 }),
    );
  });

  it('falls back to default session count and work minutes for zero-like values', () => {
    const t = {
      task: 'Quick note',
      setIsActive: vi.fn(),
      setActiveTaskId: vi.fn(),
      activeTaskMeta: { listName: '', estimatedBlocks: 0 },
      targetSessions: 0,
      workTime: 0,
    };
    startManualTask(t);
    expect(t.setActiveTaskId).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        estimatedSessionCount: 1,
        estimatedWorkMinutes: 25,
        listName: 'Quick task',
      }),
    );
  });

  it('does not call setActiveTaskId when it is not provided', () => {
    const t = { task: 'My Task', setIsActive: vi.fn() };
    expect(() => startManualTask(t)).not.toThrow();
    expect(t.setIsActive).toHaveBeenCalledWith(true);
  });
});

describe('startSuggestedTask', () => {
  it('calls setIsActive(true) immediately when task is already set', async () => {
    const t = { task: 'Existing', setIsActive: vi.fn() };
    await startSuggestedTask(t);
    expect(t.setIsActive).toHaveBeenCalledWith(true);
    expect(fetchTasks).not.toHaveBeenCalled();
  });

  it('calls setIsActive(true) when no tasks are available', async () => {
    fetchTasks.mockResolvedValueOnce([]);
    const t = { task: '', setIsActive: vi.fn() };
    await startSuggestedTask(t);
    expect(t.setIsActive).toHaveBeenCalledWith(true);
  });

  it('applies the top ranked task when tasks are available', async () => {
    const task = { id: 1, title: 'Top Task', completed: false, archived: false };
    fetchTasks.mockResolvedValueOnce([task]);
    rankTasksForFocus.mockReturnValueOnce([task]);
    const t = { task: '', setIsActive: vi.fn() };
    await startSuggestedTask(t);
    expect(applyTaskToTimer).toHaveBeenCalledWith(task, t);
  });

  it('filters out completed and archived tasks', async () => {
    fetchTasks.mockResolvedValueOnce([
      { id: 1, title: 'Done', completed: true, archived: false },
      { id: 2, title: 'Archived', completed: false, archived: true },
    ]);
    rankTasksForFocus.mockReturnValueOnce([]);
    const t = { task: '', setIsActive: vi.fn() };
    await startSuggestedTask(t);
    expect(t.setIsActive).toHaveBeenCalledWith(true);
  });

  it('calls setIsActive(true) when fetchTasks throws', async () => {
    fetchTasks.mockRejectedValueOnce(new Error('network fail'));
    const t = { task: '', setIsActive: vi.fn() };
    await startSuggestedTask(t);
    expect(t.setIsActive).toHaveBeenCalledWith(true);
  });

  it('handles non-array response from fetchTasks gracefully', async () => {
    fetchTasks.mockResolvedValueOnce(null);
    rankTasksForFocus.mockReturnValueOnce([]);
    const t = { task: '', setIsActive: vi.fn() };
    await startSuggestedTask(t);
    expect(t.setIsActive).toHaveBeenCalledWith(true);
  });
});
