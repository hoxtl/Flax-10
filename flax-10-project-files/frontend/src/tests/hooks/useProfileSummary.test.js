import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfileSummary } from '../../pages/profile/hooks/useProfileSummary';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

import { fetchApi } from '../../api/client';

describe('useProfileSummary', () => {
    beforeEach(() => {
        fetchApi.mockResolvedValue({ total_sessions: 10, total_hours: 20 });
    });

    it('starts with loading true and null summary', () => {
        fetchApi.mockReturnValueOnce(new Promise(() => {})); // never resolves
        const { result } = renderHook(() => useProfileSummary());
        expect(result.current.loading).toBe(true);
        expect(result.current.summary).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it('fetches summary on mount without userId', async () => {
        const { result } = renderHook(() => useProfileSummary());
        await act(async () => {});
        expect(fetchApi).toHaveBeenCalledWith('/profile/summary/');
        expect(result.current.loading).toBe(false);
        expect(result.current.summary).toEqual({ total_sessions: 10, total_hours: 20 });
    });

    it('fetches summary with userId when provided', async () => {
        const { result } = renderHook(() => useProfileSummary(42));
        await act(async () => {});
        expect(fetchApi).toHaveBeenCalledWith('/profile/summary/?user_id=42');
        expect(result.current.summary).toEqual({ total_sessions: 10, total_hours: 20 });
    });

    it('sets error when fetch fails', async () => {
        const err = new Error('Server error');
        fetchApi.mockRejectedValueOnce(err);
        const { result } = renderHook(() => useProfileSummary());
        await act(async () => {});
        expect(result.current.error).toBe(err);
        expect(result.current.loading).toBe(false);
    });

    it('refetch re-loads the summary', async () => {
        const { result } = renderHook(() => useProfileSummary());
        await act(async () => {});
        fetchApi.mockResolvedValueOnce({ total_sessions: 20, total_hours: 40 });
        await act(async () => {
            result.current.refetch();
        });
        await act(async () => {});
        expect(result.current.summary).toEqual({ total_sessions: 20, total_hours: 40 });
    });

    it('refetch keeps loading false when summary already exists', async () => {
        const { result } = renderHook(() => useProfileSummary());
        await act(async () => {});

        fetchApi.mockImplementationOnce(
            () => new Promise((resolve) => setTimeout(() => resolve({ total_sessions: 20, total_hours: 40 }), 0))
        );

        await act(async () => {
            result.current.refetch();
        });

        expect(result.current.loading).toBe(false);

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(result.current.summary).toEqual({ total_sessions: 20, total_hours: 40 });
    });
});
