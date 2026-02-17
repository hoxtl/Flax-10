import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskOperations } from '../../hooks/tasks/useTaskOperations';

const makeSetItems = (initialItems) => vi.fn((fn) => {
  if (typeof fn === 'function') return fn(initialItems);
});

describe('useTaskOperations', () => {
  it('should add new task and clear input', () => {
    const initialItems = [{ id: '0', title: 'Existing' }];
    const mockSetItems = makeSetItems(initialItems);
    const mockSetText = vi.fn();
    const { result } = renderHook(() => useTaskOperations(mockSetItems, vi.fn()));
    act(() => {
      result.current.addItem('New task', mockSetText);
    });
    const updated = mockSetItems.mock.results[0].value;
    expect(updated).toHaveLength(2);
    expect(updated[1].title).toBe('New task');
    expect(mockSetText).toHaveBeenCalledWith('');
  });

  it('should not add empty task', () => {
    const mockSetItems = vi.fn();
    const { result } = renderHook(() => useTaskOperations(mockSetItems, vi.fn()));
    act(() => {
      result.current.addItem('   ', vi.fn());
    });
    expect(mockSetItems).not.toHaveBeenCalled();
  });

  it('should toggle task from not done to done', () => {
    const items = [{ id: '1', done: false, completedAt: null }];
    const mockSetItems = makeSetItems(items);
    const { result } = renderHook(() => useTaskOperations(mockSetItems, vi.fn()));
    act(() => {
      result.current.toggleDone('1');
    });
    const updated = mockSetItems.mock.results[0].value;
    expect(updated[0].done).toBe(true);
    expect(updated[0].completedAt).not.toBeNull();
  });

  it('should toggle task from done to not done', () => {
    const items = [{ id: '1', done: true, completedAt: 123456 }];
    const mockSetItems = makeSetItems(items);
    const { result } = renderHook(() => useTaskOperations(mockSetItems, vi.fn()));
    act(() => {
      result.current.toggleDone('1');
    });
    const updated = mockSetItems.mock.results[0].value;
    expect(updated[0].done).toBe(false);
    expect(updated[0].completedAt).toBeNull();
  });

  it('should not change other tasks when toggling done', () => {
    const items = [{ id: '1', done: false }, { id: '2', done: false }];
    const mockSetItems = makeSetItems(items);
    const { result } = renderHook(() => useTaskOperations(mockSetItems, vi.fn()));
    act(() => {
      result.current.toggleDone('1');
    });
    const updated = mockSetItems.mock.results[0].value;
    expect(updated[1].done).toBe(false);
  });

  it('should toggle urgent from false to true', () => {
    const items = [{ id: '1', urgent: false }];
    const mockSetItems = makeSetItems(items);
    const { result } = renderHook(() => useTaskOperations(mockSetItems, vi.fn()));
    act(() => {
      result.current.toggleUrgent('1');
    });
    const updated = mockSetItems.mock.results[0].value;
    expect(updated[0].urgent).toBe(true);
  });

  it('should not change other tasks when toggling urgent', () => {
    const items = [{ id: '1', urgent: false }, { id: '2', urgent: true }];
    const mockSetItems = makeSetItems(items);
    const { result } = renderHook(() => useTaskOperations(mockSetItems, vi.fn()));
    act(() => {
      result.current.toggleUrgent('1');
    });
    const updated = mockSetItems.mock.results[0].value;
    expect(updated[1].urgent).toBe(true);
  });

  it('should delete task and close menu', () => {
    const items = [{ id: '1' }, { id: '2' }];
    const mockSetItems = makeSetItems(items);
    const mockSetTaskMenuId = vi.fn();
    const { result } = renderHook(() => useTaskOperations(mockSetItems, mockSetTaskMenuId));
    act(() => {
      result.current.deleteTask('1');
    });
    const updated = mockSetItems.mock.results[0].value;
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('2');
    expect(mockSetTaskMenuId).toHaveBeenCalledWith(null);
  });

  it('should clear completed tasks', () => {
    const items = [{ id: '1', done: false }, { id: '2', done: true }];
    const mockSetItems = makeSetItems(items);
    const mockSetMenuOpen = vi.fn();
    const { result } = renderHook(() => useTaskOperations(mockSetItems, vi.fn()));
    act(() => {
      result.current.clearCompleted(mockSetMenuOpen);
    });
    const updated = mockSetItems.mock.results[0].value;
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe('1');
    expect(mockSetMenuOpen).toHaveBeenCalledWith(false);
  });

  it('should save edit with valid text', () => {
    const items = [{ id: '1', title: 'Old' }, { id: '2', title: 'Keep' }];
    const mockSetItems = makeSetItems(items);
    const mockSetEditingId = vi.fn();
    const mockSetEditText = vi.fn();
    const { result } = renderHook(() => useTaskOperations(mockSetItems, vi.fn()));
    act(() => {
      result.current.saveEdit('1', 'Updated', mockSetEditingId, mockSetEditText);
    });
    const updated = mockSetItems.mock.results[0].value;
    expect(updated[0].title).toBe('Updated');
    expect(updated[1].title).toBe('Keep');
    expect(mockSetEditingId).toHaveBeenCalledWith(null);
    expect(mockSetEditText).toHaveBeenCalledWith('');
  });

  it('should not save edit with empty text', () => {
    const mockSetItems = vi.fn();
    const mockSetEditingId = vi.fn();
    const mockSetEditText = vi.fn();
    const { result } = renderHook(() => useTaskOperations(mockSetItems, vi.fn()));
    act(() => {
      result.current.saveEdit('1', '   ', mockSetEditingId, mockSetEditText);
    });
    expect(mockSetItems).not.toHaveBeenCalled();
    expect(mockSetEditingId).toHaveBeenCalledWith(null);
    expect(mockSetEditText).toHaveBeenCalledWith('');
  });
});