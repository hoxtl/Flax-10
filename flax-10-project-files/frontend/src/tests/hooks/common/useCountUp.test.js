import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCountUp } from '../../../hooks/useCountUp';

describe('useCountUp', () => {
    let now = 0;

    beforeEach(() => {
        now = 0;
        vi.stubGlobal('performance', { now: () => now });
        vi.stubGlobal('requestAnimationFrame', (cb) => {
            now += 1000;
            cb(now);
            return 1;
        });
    });

    afterEach(() => {
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
        const { result, rerender } = renderHook(({ target, duration }) => useCountUp(target, duration), {
            initialProps: { target: 100, duration: 100 },
        });
        result.current.current = div;

        // retrigger effect after ref is attached
        rerender({ target: 100, duration: 101 });
        expect(div.textContent).toBe('100');
        document.body.removeChild(div);
    });

    it('uses decimal format for float targets', () => {
        const div = document.createElement('div');
        document.body.appendChild(div);
        const { result, rerender } = renderHook(({ target, duration }) => useCountUp(target, duration), {
            initialProps: { target: 2.5, duration: 100 },
        });
        result.current.current = div;
        rerender({ target: 2.5, duration: 101 });
        expect(div.textContent).toBe('2.5');
        document.body.removeChild(div);
    });
});
