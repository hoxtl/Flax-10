import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockDragUtils = vi.hoisted(() => ({
    parseDropPayload: vi.fn(() => ({ type: 'event', data: { id: 1 } })),
    setupDragStart: vi.fn(),
    handleDragOverEffect: vi.fn(),
}));

vi.mock('../../components/Calendar/utils/dragUtils', () => mockDragUtils);

import { useDrag, useDrop } from '../../components/Calendar/hooks/useDragDrop';

describe('useDrag', () => {
    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', (cb) => { cb(); return 1; });
        mockDragUtils.setupDragStart.mockClear();
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

    it('calls setupDragStart and sets isDragging true after onDragStart', () => {
        const { result } = renderHook(() => useDrag({ type: 'event', data: { id: 1 } }));
        const mockEl = { style: {} };
        act(() => {
            result.current.dragProps.onDragStart({ currentTarget: mockEl });
        });
        expect(mockDragUtils.setupDragStart).toHaveBeenCalled();
        expect(result.current.isDragging).toBe(true);
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

    it('sets isOver to false after dragLeave when counter reaches 0', () => {
        const { result } = renderHook(() => useDrop({ accept: 'event', onDrop: vi.fn() }));
        act(() => {
            result.current.dropProps.onDragEnter({ preventDefault: vi.fn() });
        });
        expect(result.current.isOver).toBe(true);
        act(() => {
            result.current.dropProps.onDragLeave();
        });
        expect(result.current.isOver).toBe(false);
    });

    it('calls onDrop with payload when drop occurs and payload is valid', () => {
        const onDrop = vi.fn();
        const { result } = renderHook(() => useDrop({ accept: 'event', onDrop }));
        const mockEvent = { preventDefault: vi.fn(), dataTransfer: {} };
        act(() => {
            result.current.dropProps.onDrop(mockEvent);
        });
        expect(onDrop).toHaveBeenCalledWith({ type: 'event', data: { id: 1 } }, mockEvent);
        expect(result.current.isOver).toBe(false);
    });

    it('does not call onDrop when parseDropPayload returns null', () => {
        mockDragUtils.parseDropPayload.mockReturnValueOnce(null);
        const onDrop = vi.fn();
        const { result } = renderHook(() => useDrop({ accept: 'event', onDrop }));
        act(() => {
            result.current.dropProps.onDrop({ preventDefault: vi.fn(), dataTransfer: {} });
        });
        expect(onDrop).not.toHaveBeenCalled();
    });
});
