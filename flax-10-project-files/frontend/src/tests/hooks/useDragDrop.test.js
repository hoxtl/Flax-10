import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../components/Calendar/utils/dragUtils', () => ({
    parseDropPayload: vi.fn(() => ({ type: 'event', data: { id: 1 } })),
    setupDragStart: vi.fn(),
    handleDragOverEffect: vi.fn(),
}));

import { useDrag, useDrop } from '../../components/Calendar/hooks/useDragDrop';

describe('useDrag', () => {
    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', (cb) => { cb(); return 1; });
    });

    it('returns dragProps with draggable true', () => {
        const { result } = renderHook(() => useDrag({ type: 'event', data: { id: 1 } }));
        expect(result.current.dragProps.draggable).toBe(true);
    });

    it('starts with isDragging false', () => {
        const { result } = renderHook(() => useDrag({ type: 'event', data: { id: 1 } }));
        expect(result.current.isDragging).toBe(false);
    });

    it('has onDragStart and onDragEnd handlers', () => {
        const { result } = renderHook(() => useDrag({ type: 'event', data: {} }));
        expect(typeof result.current.dragProps.onDragStart).toBe('function');
        expect(typeof result.current.dragProps.onDragEnd).toBe('function');
    });

    it('sets isDragging to false after dragEnd', () => {
        const { result } = renderHook(() => useDrag({ type: 'event', data: {} }));
        const mockEl = { style: {} };
        act(() => {
            result.current.dragProps.onDragEnd({ currentTarget: mockEl });
        });
        expect(result.current.isDragging).toBe(false);
    });
});

describe('useDrop', () => {
    it('returns dropProps and isOver', () => {
        const { result } = renderHook(() => useDrop({ accept: 'event', onDrop: vi.fn() }));
        expect(result.current.dropProps).toBeTruthy();
        expect(result.current.isOver).toBe(false);
    });

    it('has drag event handlers', () => {
        const { result } = renderHook(() => useDrop({ accept: 'event', onDrop: vi.fn() }));
        expect(typeof result.current.dropProps.onDragEnter).toBe('function');
        expect(typeof result.current.dropProps.onDragOver).toBe('function');
        expect(typeof result.current.dropProps.onDragLeave).toBe('function');
        expect(typeof result.current.dropProps.onDrop).toBe('function');
    });

    it('sets isOver to true on dragEnter', () => {
        const { result } = renderHook(() => useDrop({ accept: 'event', onDrop: vi.fn() }));
        act(() => {
            result.current.dropProps.onDragEnter({ preventDefault: vi.fn() });
        });
        expect(result.current.isOver).toBe(true);
    });
});
