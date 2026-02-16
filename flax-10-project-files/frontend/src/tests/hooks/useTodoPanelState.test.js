import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodoPanelState } from '../../hooks/tasks/useTodoPanelState';

describe('useTodoPanelState', () => {
  it('should initialise with empty text', () => {
    const { result } = renderHook(() => useTodoPanelState());
    expect(result.current.text).toBe('');
    expect(result.current.editingId).toBeNull();
    expect(result.current.editText).toBe('');
    expect(result.current.menuOpen).toBe(false);
  });

  it('should set text', () => {
    const { result } = renderHook(() => useTodoPanelState());
    act(() => {
      result.current.setText('New task');
    });
    expect(result.current.text).toBe('New task');
  });

  it('should set editing id', () => {
    const { result } = renderHook(() => useTodoPanelState());
    act(() => {
      result.current.setEditingId('task-1');
    });
    expect(result.current.editingId).toBe('task-1');
  });

  it('should set edit text', () => {
    const { result } = renderHook(() => useTodoPanelState());
    act(() => {
      result.current.setEditText('Edited');
    });
    expect(result.current.editText).toBe('Edited');
  });

  it('should set menu open', () => {
    const { result } = renderHook(() => useTodoPanelState());
    act(() => {
      result.current.setMenuOpen(true);
    });
    expect(result.current.menuOpen).toBe(true);
  });
});