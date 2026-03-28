import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../../../pages/homepage/hooks/useCountdown';

describe('useCountdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns empty string and relaxed urgency for null targetTime', () => {
        const { result } = renderHook(() => useCountdown(null));
        expect(result.current.text).toBe('');
        expect(result.current.urgency).toBe('relaxed');
    });

    it('returns empty string for undefined targetTime', () => {
        const { result } = renderHook(() => useCountdown(undefined));
        expect(result.current.text).toBe('');
        expect(result.current.urgency).toBe('relaxed');
    });

    it('returns "now" for target within 1 minute', () => {
        const target = new Date(Date.now() + 30 * 1000); // 30 seconds
        const { result } = renderHook(() => useCountdown(target));
        expect(result.current.text).toBe('now');
        expect(result.current.urgency).toBe('urgent');
    });

    it('returns "in Xm" for target within 1 hour', () => {
        const target = new Date(Date.now() + 25 * 60 * 1000); // 25 minutes
        const { result } = renderHook(() => useCountdown(target));
        expect(result.current.text).toBe('in 25m');
        expect(result.current.urgency).toBe('soon');
    });

    it('returns "in Xh" for target multiple hours away (exact hours)', () => {
        const target = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        const { result } = renderHook(() => useCountdown(target));
        expect(result.current.text).toBe('in 2h');
        expect(result.current.urgency).toBe('relaxed');
    });

    it('returns "in Xh Ym" for non-exact hours', () => {
        const target = new Date(Date.now() + 90 * 60 * 1000); // 1h 30m
        const { result } = renderHook(() => useCountdown(target));
        expect(result.current.text).toBe('in 1h 30m');
        expect(result.current.urgency).toBe('relaxed');
    });

    it('returns urgent when < 10 minutes', () => {
        const target = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        const { result } = renderHook(() => useCountdown(target));
        expect(result.current.urgency).toBe('urgent');
    });

    it('returns soon when 10-30 minutes', () => {
        const target = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes
        const { result } = renderHook(() => useCountdown(target));
        expect(result.current.urgency).toBe('soon');
    });

    it('returns relaxed when > 30 minutes', () => {
        const target = new Date(Date.now() + 45 * 60 * 1000); // 45 minutes
        const { result } = renderHook(() => useCountdown(target));
        expect(result.current.urgency).toBe('relaxed');
    });

    it('returns empty string when target is in the past', () => {
        const target = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
        const { result } = renderHook(() => useCountdown(target));
        expect(result.current.text).toBe('');
    });
});
