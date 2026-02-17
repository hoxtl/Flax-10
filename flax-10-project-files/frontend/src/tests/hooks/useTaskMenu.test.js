import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskMenu } from '../../hooks/tasks/useTaskMenu';

describe('useTaskMenu', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
  });

  it('should initialise with null task menu id', () => {
    const { result } = renderHook(() => useTaskMenu());
    expect(result.current.taskMenuId).toBeNull();
    expect(result.current.taskMenuPos).toEqual({ top: 0, left: 0 });
  });

  it('should set task menu id', () => {
    const { result } = renderHook(() => useTaskMenu());
    act(() => {
      result.current.setTaskMenuId('task-1');
    });
    expect(result.current.taskMenuId).toBe('task-1');
  });

  it('should not update position when menu ref is null', () => {
    const { result } = renderHook(() => useTaskMenu());
    result.current.taskMenuRef.current = null;
    act(() => {
      result.current.setTaskMenuId('task-1');
      result.current.setTaskMenuAnchor({ x: 100, y: 200, w: 50, h: 30 });
    });
    expect(result.current.taskMenuPos).toEqual({ top: 0, left: 0 });
  });

  it('should set anchor and update position', () => {
    const { result } = renderHook(() => useTaskMenu());
    const mockEl = document.createElement('div');
    Object.defineProperty(mockEl, 'offsetWidth', { value: 100 });
    Object.defineProperty(mockEl, 'offsetHeight', { value: 50 });
    result.current.taskMenuRef.current = mockEl;
    act(() => {
      result.current.setTaskMenuId('task-1');
      result.current.setTaskMenuAnchor({ x: 100, y: 200, w: 50, h: 30 });
    });
    expect(result.current.taskMenuPos.top).toBeGreaterThan(0);
    expect(result.current.taskMenuPos.left).toBeGreaterThan(0);
  });

  it('should position menu within viewport bounds', () => {
    const { result } = renderHook(() => useTaskMenu());
    const mockEl = document.createElement('div');
    Object.defineProperty(mockEl, 'offsetWidth', { value: 100 });
    Object.defineProperty(mockEl, 'offsetHeight', { value: 50 });
    result.current.taskMenuRef.current = mockEl;
    act(() => {
      result.current.setTaskMenuId('task-1');
      result.current.setTaskMenuAnchor({ x: 1000, y: 700, w: 50, h: 30 });
    });
    expect(result.current.taskMenuPos.left).toBeLessThanOrEqual(1024);
    expect(result.current.taskMenuPos.top).toBeLessThanOrEqual(768);
  });

  it('should flip menu above anchor if no space below', () => {
    const { result } = renderHook(() => useTaskMenu());
    const mockEl = document.createElement('div');
    Object.defineProperty(mockEl, 'offsetWidth', { value: 100 });
    Object.defineProperty(mockEl, 'offsetHeight', { value: 200 });
    result.current.taskMenuRef.current = mockEl;
    act(() => {
      result.current.setTaskMenuId('task-1');
      result.current.setTaskMenuAnchor({ x: 100, y: 700, w: 50, h: 30 });
    });
    expect(result.current.taskMenuPos.top).toBeLessThan(700);
  });
});