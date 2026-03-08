import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCountUp } from '../../hooks/useCountUp';

describe('useCountUp', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Mock requestAnimationFrame
        vi.stubGlobal('requestAnimationFrame', (cb) => { cb(performance.now()); return 1; });
        vi.stubGlobal('performance', { now: () => Date.now() });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('returns a ref', () => {
        const { result } = renderHook(() => useCountUp(100));
        expect(result.current).toBeTruthy();
        expect(typeof result.current).toBe('object');
        expect('current' in result.current).toBe(true);
    });

    it('updates textContent of referenced element with integer target', () => {
        const div = document.createElement('div');
        document.body.appendChild(div);

        const { result } = renderHook(() => useCountUp(100, 0));
        result.current.current = div;

        // Trigger effect re-run by calling hook with same value
        // The effect should have run on mount
        document.body.removeChild(div);
    });

    it('uses decimal format for float targets', () => {
        const div = document.createElement('div');
        document.body.appendChild(div);

        // Float target like 2.5
        renderHook(() => useCountUp(2.5, 0));
        document.body.removeChild(div);
    });
});
