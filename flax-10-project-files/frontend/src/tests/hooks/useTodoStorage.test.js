import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodoStorage } from '../../hooks/tasks/useTodoStorage';

describe('useTodoStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialise with empty array if no stored data', () => {
    const { result } = renderHook(() => useTodoStorage());
    
    expect(result.current.items).toEqual([]);
  });

  it('should load tasks from localStorage on mount', () => {
    const mockTasks = [
      { id: 1, text: 'Test task', completed: false, urgent: false, timestamp: Date.now() },
    ];
    localStorage.setItem('todoItems', JSON.stringify(mockTasks));
    
    const { result } = renderHook(() => useTodoStorage());
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].text).toBe('Test task');
  });

  it('should save tasks to localStorage when updated', () => {
    const { result } = renderHook(() => useTodoStorage());
    
    const newTask = { id: 1, text: 'New task', completed: false, urgent: false, timestamp: Date.now() };
    
    act(() => {
      result.current.setItems([newTask]);
    });
    
    const stored = JSON.parse(localStorage.getItem('todoItems'));
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe('New task');
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('todoItems', 'invalid json');
    
    const { result } = renderHook(() => useTodoStorage());
    
    expect(result.current.items).toEqual([]);
  });
});