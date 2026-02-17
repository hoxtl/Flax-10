import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskReorder } from '../../hooks/tasks/useTaskReorder';

describe('useTaskReorder', () => {
  it('should reorder tasks and append done tasks at end', () => {
    const mockSetItems = vi.fn((fn) => {
      const prev = [
        { id: '1', done: false },
        { id: '2', done: false },
        { id: '3', done: true },
      ];
      const result = fn(prev);
      expect(result[2].id).toBe('3');
      expect(result[2].done).toBe(true);
    });
    const { result } = renderHook(() => useTaskReorder(mockSetItems));
    act(() => {
      result.current.onReorderActive([{ id: '2' }, { id: '1' }]);
    });
  });

  it('should handle empty done tasks', () => {
    const mockSetItems = vi.fn((fn) => {
      const prev = [{ id: '1', done: false }, { id: '2', done: false }];
      const result = fn(prev);
      expect(result).toHaveLength(2);
    });
    const { result } = renderHook(() => useTaskReorder(mockSetItems));
    act(() => {
      result.current.onReorderActive([{ id: '2' }, { id: '1' }]);
    });
  });

  it('should filter and separate done tasks correctly', () => {
    const mockSetItems = vi.fn((fn) => {
      const prev = [
        { id: '1', done: false },
        { id: '2', done: true },
        { id: '3', done: true },
        { id: '4', done: false },
      ];
      const result = fn(prev);
      const doneTasks = result.filter(x => x.done);
      expect(doneTasks).toHaveLength(2);
    });
    const { result } = renderHook(() => useTaskReorder(mockSetItems));
    act(() => {
      result.current.onReorderActive([{ id: '4' }, { id: '1' }]);
    });
  });
});