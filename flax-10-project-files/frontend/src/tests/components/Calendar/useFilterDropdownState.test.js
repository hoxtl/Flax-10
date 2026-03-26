/**
 * Tests for useFilterDropdownState - filter dropdown state management.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFilterDropdownState } from '../../../components/calendar/header/useFilterDropdownState';

// Mock CSS module
vi.mock('../../../components/calendar/header/CalendarHeaderUtils.module.css', () => ({
    default: { filterPopup: 'filterPopup' },
}));

const mockTags = [
    { label: 'Work', color: '#111', icon: '💼' },
    { label: 'Study', color: '#222', icon: '📚' },
    { label: 'work', color: '#111', icon: '💼' }, // duplicate (same label lower)
];

vi.mock('../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({ tags: mockTags })),
}));

describe('useFilterDropdownState', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset RAF
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(); return 1; });
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    });

    it('initializes with closed dropdown', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, onChange));
        expect(result.current.isOpen).toBe(false);
        expect(result.current.showManager).toBe(false);
    });

    it('toggles open state on onToggle call', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));
        act(() => result.current.onToggle());
        expect(result.current.isOpen).toBe(true);
        act(() => result.current.onToggle());
        expect(result.current.isOpen).toBe(false);
    });

    it('returns activeCount of 0 when active is "all"', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));
        expect(result.current.activeCount).toBe(0);
    });

    it('returns activeCount from array active values', () => {
        const { result } = renderHook(() => useFilterDropdownState(['work', 'study'], true, false, vi.fn()));
        expect(result.current.activeCount).toBe(2);
    });

    it('normalizes array containing "all" to empty selection', () => {
        const { result } = renderHook(() => useFilterDropdownState(['all', 'work'], true, false, vi.fn()));
        expect(result.current.activeCount).toBe(0);
    });

    it('includes wrapRef in return value', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));
        expect(result.current.wrapRef).toBeDefined();
    });

    it('provides mouse handlers when not mobile', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));
        expect(result.current.onMouseEnter).toBeDefined();
        expect(result.current.onMouseLeave).toBeDefined();
    });

    it('omits mouse handlers when mobile', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, true, vi.fn()));
        expect(result.current.onMouseEnter).toBeUndefined();
        expect(result.current.onMouseLeave).toBeUndefined();
    });

    it('closes manager on onCloseManager call', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));
        act(() => result.current.onToggle());
        act(() => result.current.popupProps.onManageTags());
        expect(result.current.showManager).toBe(true);
        act(() => result.current.onCloseManager());
        expect(result.current.showManager).toBe(false);
    });

    it('onManageTags closes dropdown and opens manager', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));
        act(() => result.current.onToggle());
        expect(result.current.isOpen).toBe(true);
        act(() => result.current.popupProps.onManageTags());
        expect(result.current.isOpen).toBe(false);
        expect(result.current.showManager).toBe(true);
    });

    it('calls onChange with selected tag ids on selection change', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, onChange));
        act(() => {
            result.current.popupProps.onSelectionChange([{ id: 'work' }, { id: 'study' }]);
        });
        expect(onChange).toHaveBeenCalledWith(['work', 'study']);
    });

    it('calls onChange with "all" when no tags selected', () => {
        const onChange = vi.fn();
        const { result } = renderHook(() => useFilterDropdownState('work', true, false, onChange));
        act(() => {
            result.current.popupProps.onSelectionChange([]);
        });
        expect(onChange).toHaveBeenCalledWith('all');
    });

    it('popupProps includes correct selectedTags', () => {
        const { result } = renderHook(() => useFilterDropdownState(['work'], true, false, vi.fn()));
        expect(result.current.popupProps.selectedTags).toBeDefined();
        expect(result.current.popupProps.selectedTags.some(t => t.id === 'work')).toBe(true);
    });

    it('popupProps includes deduplicated tag objects', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));
        // mockTags has duplicate 'work' labels; should be deduplicated
        const tagIds = result.current.popupProps.tags.map(t => t.id);
        const uniqueIds = [...new Set(tagIds)];
        expect(tagIds).toEqual(uniqueIds);
    });

    it('mouse hover opens and closes dropdown with delay', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));

        act(() => result.current.onMouseEnter());
        expect(result.current.isOpen).toBe(true);

        act(() => result.current.onMouseLeave());
        // Still open until timeout
        expect(result.current.isOpen).toBe(true);

        act(() => vi.advanceTimersByTime(200));
        expect(result.current.isOpen).toBe(false);

        vi.useRealTimers();
    });

    it('outside click closes dropdown', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));
        act(() => result.current.onToggle());
        expect(result.current.isOpen).toBe(true);

        act(() => {
            const event = new MouseEvent('mousedown', { bubbles: true });
            document.dispatchEvent(event);
        });

        expect(result.current.isOpen).toBe(false);
    });

    it('outside click does not close when click is inside ref', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));
        act(() => result.current.onToggle());

        // Simulate click inside the ref element
        const div = document.createElement('div');
        document.body.appendChild(div);
        Object.defineProperty(result.current.wrapRef, 'current', { value: div, writable: true });

        act(() => {
            const event = new MouseEvent('mousedown', { bubbles: true });
            div.dispatchEvent(event);
        });

        // Should remain open
        expect(result.current.isOpen).toBe(true);
        document.body.removeChild(div);
    });

    it('popupShift is 0 when closed', () => {
        const { result } = renderHook(() => useFilterDropdownState('all', true, false, vi.fn()));
        expect(result.current.popupProps.shift).toBe(0);
    });
});
