/**
 * Tests for useKeyboardNav - keyboard navigation for table cells.
 */
<<<<<<< HEAD

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardNav } from '../../../../components/calendar/hooks/useKeyboardNav';
=======
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardNav } from '../../../../components/Calendar/hooks/useKeyboardNav';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

describe('useKeyboardNav', () => {
    const mockSave = vi.fn();
    const mockCancel = vi.fn();
    const mockStart = vi.fn();

    beforeEach(() => vi.clearAllMocks());

    it('returns focusedCell, handleKeyDown, and EDITABLE_COLUMNS', () => {
        const { result } = renderHook(() => useKeyboardNav(5, mockStart, mockSave, mockCancel));
        expect(result.current.focusedCell).toBeNull();
        expect(typeof result.current.handleKeyDown).toBe('function');
        expect(result.current.EDITABLE_COLUMNS).toContain('title');
    });

    it('saves and clears focus on Enter', () => {
        const { result } = renderHook(() => useKeyboardNav(5, mockStart, mockSave, mockCancel));
        const event = { key: 'Enter', preventDefault: vi.fn() };
        act(() => result.current.handleKeyDown(event, 0, 0));
        expect(mockSave).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('cancels and clears focus on Escape', () => {
        const { result } = renderHook(() => useKeyboardNav(5, mockStart, mockSave, mockCancel));
        const event = { key: 'Escape', preventDefault: vi.fn() };
        act(() => result.current.handleKeyDown(event, 0, 0));
        expect(mockCancel).toHaveBeenCalled();
    });

    it('moves to next cell on Tab', () => {
        const { result } = renderHook(() => useKeyboardNav(5, mockStart, mockSave, mockCancel));
        const event = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
        act(() => result.current.handleKeyDown(event, 0, 0));
        expect(mockSave).toHaveBeenCalled();
        expect(result.current.focusedCell).toEqual({ row: 0, col: 1 });
    });

    it('moves to prev cell on Shift+Tab', () => {
        const { result } = renderHook(() => useKeyboardNav(5, mockStart, mockSave, mockCancel));
        const event = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() };
        act(() => result.current.handleKeyDown(event, 0, 1));
        expect(result.current.focusedCell).toEqual({ row: 0, col: 0 });
    });

    it('moves to next row when at end of columns', () => {
        const { result } = renderHook(() => useKeyboardNav(5, mockStart, mockSave, mockCancel));
        const event = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
        act(() => result.current.handleKeyDown(event, 0, 3));
        expect(result.current.focusedCell).toEqual({ row: 1, col: 0 });
    });

    it('moves to prev row when at start of columns', () => {
        const { result } = renderHook(() => useKeyboardNav(5, mockStart, mockSave, mockCancel));
        const event = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() };
        act(() => result.current.handleKeyDown(event, 1, 0));
        expect(result.current.focusedCell).toEqual({ row: 0, col: 3 });
    });

    it('returns null when moving past last cell', () => {
        const { result } = renderHook(() => useKeyboardNav(2, mockStart, mockSave, mockCancel));
        const event = { key: 'Tab', shiftKey: false, preventDefault: vi.fn() };
        act(() => result.current.handleKeyDown(event, 1, 3));
        expect(result.current.focusedCell).toBeNull();
    });

    it('returns null when moving before first cell', () => {
        const { result } = renderHook(() => useKeyboardNav(2, mockStart, mockSave, mockCancel));
        const event = { key: 'Tab', shiftKey: true, preventDefault: vi.fn() };
        act(() => result.current.handleKeyDown(event, 0, 0));
        expect(result.current.focusedCell).toBeNull();
    });
});
