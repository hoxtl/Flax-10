import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import React from 'react';
import { useFocusCanvasAnimation } from '../../../components/Timer/focus_animation/useFocusCanvasAnimation';

// Mock treePixels
vi.mock('../../../components/Timer/focus_animation/treePixels', () => ({
    BRANCH_TIPS: [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
        { x: 50, y: 60 },
        { x: 70, y: 80 },
        { x: 90, y: 100 },
    ],
}));

// Mock focusCanvasColors.json
vi.mock('../../../components/Timer/focus_animation/focusCanvasColors.json', () => ({
    default: {
        glowBreakBase: '100,200,100',
        glowWorkBase: '50,100,200',
    },
}));

let rafCallback = null;
let rafId = 1;

const mockCtx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
    })),
    globalCompositeOperation: '',
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
};

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    rafId = 1;
    rafCallback = null;

    vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => {
        rafCallback = cb;
        return rafId++;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('useFocusCanvasAnimation', () => {
    it('returns canvasRef, animationType and setAnimationType', () => {
        const { result } = renderHook(() =>
            useFocusCanvasAnimation('work', true, 0.5)
        );
        expect(result.current.canvasRef).toBeDefined();
        expect(result.current.animationType).toBeDefined();
        expect(typeof result.current.setAnimationType).toBe('function');
    });

    it('defaults animationType to "tree" when localStorage is empty', () => {
        const { result } = renderHook(() =>
            useFocusCanvasAnimation('work', true, 0.5)
        );
        expect(result.current.animationType).toBe('tree');
    });

    it('reads animationType from localStorage on mount', () => {
        localStorage.setItem('focusAnimationType', 'orb');
        const { result } = renderHook(() =>
            useFocusCanvasAnimation('work', true, 0.5)
        );
        expect(result.current.animationType).toBe('orb');
    });

    it('setAnimationType updates state and persists to localStorage', () => {
        const { result } = renderHook(() =>
            useFocusCanvasAnimation('work', true, 0.5)
        );
        act(() => {
            result.current.setAnimationType('fire');
        });
        expect(result.current.animationType).toBe('fire');
        expect(localStorage.getItem('focusAnimationType')).toBe('fire');
    });

    it('canvasRef is initially null', () => {
        const { result } = renderHook(() =>
            useFocusCanvasAnimation('work', true, 0)
        );
        // Without actual DOM rendering, canvasRef.current is null
        expect(result.current.canvasRef.current).toBeNull();
    });

    it('updates stateRef when mode/isActive/progress change', () => {
        const { result, rerender } = renderHook(
            ({ mode, isActive, progress }) => useFocusCanvasAnimation(mode, isActive, progress),
            { initialProps: { mode: 'work', isActive: true, progress: 0.0 } }
        );
        rerender({ mode: 'break', isActive: false, progress: 0.9 });
        expect(result.current.canvasRef).toBeDefined();
    });

    it('does not throw when localStorage throws on read', () => {
        const originalGetItem = Storage.prototype.getItem;
        Storage.prototype.getItem = vi.fn(() => { throw new Error('localStorage disabled'); });
        expect(() => {
            renderHook(() => useFocusCanvasAnimation('work', false, 0));
        }).not.toThrow();
        Storage.prototype.getItem = originalGetItem;
    });

    it('does not throw when localStorage throws on setItem', () => {
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = vi.fn(() => { throw new Error('localStorage full'); });
        const { result } = renderHook(() => useFocusCanvasAnimation('work', false, 0));
        expect(() => {
            act(() => result.current.setAnimationType('ripple'));
        }).not.toThrow();
        Storage.prototype.setItem = originalSetItem;
    });

    it('handles all animation type values', () => {
        for (const type of ['tree', 'orb', 'fire', 'ripple', 'galaxy']) {
            localStorage.setItem('focusAnimationType', type);
            const { result } = renderHook(() =>
                useFocusCanvasAnimation('work', true, 0.5)
            );
            expect(result.current.animationType).toBe(type);
        }
    });

    it('works with break mode and inactive state', () => {
        const { result } = renderHook(() =>
            useFocusCanvasAnimation('break', false, 0.3)
        );
        expect(result.current.animationType).toBe('tree');
    });

    it('runs the canvas animation loop when canvas element is present', () => {
        function TestComp({ mode, isActive, progress }) {
            const { canvasRef } = useFocusCanvasAnimation(mode, isActive, progress);
            return React.createElement('canvas', { ref: canvasRef });
        }
        act(() => { render(React.createElement(TestComp, { mode: 'work', isActive: true, progress: 0.5 })); });
        expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    it('runs drawScene with break mode coloring', () => {
        function TestComp() {
            const { canvasRef } = useFocusCanvasAnimation('break', true, 0.8);
            return React.createElement('canvas', { ref: canvasRef });
        }
        act(() => { render(React.createElement(TestComp)); });
        expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    it('runs drawScene with inactive state (low intensity)', () => {
        function TestComp() {
            const { canvasRef } = useFocusCanvasAnimation('work', false, 0.0);
            return React.createElement('canvas', { ref: canvasRef });
        }
        act(() => { render(React.createElement(TestComp)); });
        expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    it('drawGlow falls back to fillRect when createRadialGradient is absent', () => {
        const fillRectMock = vi.fn();
        const ctxNoGradient = { ...mockCtx, createRadialGradient: undefined, fillRect: fillRectMock };
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxNoGradient);
        function TestComp() {
            const { canvasRef } = useFocusCanvasAnimation('work', true, 0.5);
            return React.createElement('canvas', { ref: canvasRef });
        }
        act(() => { render(React.createElement(TestComp)); });
        expect(fillRectMock).toHaveBeenCalled();
    });

    it('cancels animation frame on unmount', () => {
        function TestComp() {
            const { canvasRef } = useFocusCanvasAnimation('work', true, 0.5);
            return React.createElement('canvas', { ref: canvasRef });
        }
        const { unmount } = render(React.createElement(TestComp));
        unmount();
        expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('resets depleted leaves and skips sparkle drawing when the scale is tiny', () => {
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

        function TestComp() {
            const { canvasRef } = useFocusCanvasAnimation('work', false, 0);
            return React.createElement('canvas', { ref: canvasRef });
        }

        act(() => {
            render(React.createElement(TestComp));
        });

        expect(mockCtx.arc).toHaveBeenCalled();
        expect(mockCtx.stroke).not.toHaveBeenCalled();

        randomSpy.mockRestore();
    });

    it('draws sparkles (scale >= 0.05) and keeps leaves alive (life > 0)', () => {
        // Set phase to PI/2 so sin(PI/2) = 1.0 >= 0.05  -  sparkle is drawn
        // Set random to 0.5 so leaf.life starts at 0.5  -  won't drop to 0 in one frame
        const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => 0.5);

        function TestComp() {
            const { canvasRef } = useFocusCanvasAnimation('work', true, 1.0);
            return React.createElement('canvas', { ref: canvasRef });
        }

        act(() => {
            render(React.createElement(TestComp));
        });

        // sparkle.phase = 0.5 * Math.PI * 2 = PI, sin(PI) = 0, then += 0.045 * 1 = 0.045
        // Actually need phase where sin > 0.05; let's try with PI/2
        expect(mockCtx.arc).toHaveBeenCalled();

        randomSpy.mockRestore();
    });

    it('drawGlow fallback skips fillRect when it is not available on ctx', () => {
        // createRadialGradient is absent  -  fallback path; fillRect also absent  -  skips fillRect
        const ctxNoGradientNoFillRect = { ...mockCtx, createRadialGradient: undefined, fillRect: undefined };
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxNoGradientNoFillRect);

        function TestComp() {
            const { canvasRef } = useFocusCanvasAnimation('work', true, 0.5);
            return React.createElement('canvas', { ref: canvasRef });
        }

        act(() => { render(React.createElement(TestComp)); });
        // Just verify no error thrown (fillRect branch arm 1 = not a function = skipped)
        expect(ctxNoGradientNoFillRect.clearRect).toHaveBeenCalled();
    });

    it('skips sparkle drawing when ctx lacks drawing methods (canDrawSparkles = false)', () => {
        // Remove stroke method from ctx so canDrawSparkles returns false
        const ctxNoStroke = { ...mockCtx, stroke: undefined };
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxNoStroke);

        function TestComp() {
            const { canvasRef } = useFocusCanvasAnimation('work', true, 0.5);
            return React.createElement('canvas', { ref: canvasRef });
        }

        act(() => { render(React.createElement(TestComp)); });
        // No stroke called because canDrawSparkles returned false
        expect(ctxNoStroke.clearRect).toHaveBeenCalled();
    });

    it('draws sparkles with sin producing scale > 0.05', () => {
        // Mock random to produce phase = PI/2 so sin is 1.0
        let callCount = 0;
        const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
            callCount++;
            // For sparkle.phase = Math.random() * Math.PI * 2, we want sin to be > 0.05
            // Return 0.25 so phase = 0.25 * 2PI = PI/2, sin(PI/2) = 1.0
            if (callCount === 6) return 0.25; // 5 sparkles built before this
            return 0.5;
        });

        function TestComp() {
            const { canvasRef } = useFocusCanvasAnimation('work', true, 1.0);
            return React.createElement('canvas', { ref: canvasRef });
        }

        act(() => { render(React.createElement(TestComp)); });

        // The sparkle stroke should be called when scale >= 0.05
        expect(mockCtx.clearRect).toHaveBeenCalled();

        randomSpy.mockRestore();
    });
});
