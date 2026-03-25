/*
 * Tests for admin React hooks: useAsyncAction, useAsyncList, usePaginatedItems.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { fetchAdminUsers } = vi.hoisted(() => ({
  fetchAdminUsers: vi.fn(),
}));

vi.mock('../../../api/adminApi', () => ({
  fetchAdminUsers,
}));

import { useAsyncAction } from '../../../pages/Admin/hooks/useAsyncAction';
import { useAsyncList } from '../../../pages/Admin/hooks/useAsyncList';
import { usePaginatedItems } from '../../../pages/Admin/hooks/usePaginatedItems';
import { useUsersTabState } from '../../../pages/Admin/hooks/useUsersTabState';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAsyncAction', () => {
  it('starts with busy as null', () => {
    const { result } = renderHook(() => useAsyncAction(vi.fn()));
    expect(result.current.busy).toBeNull();
  });

  it('sets busy to the given id while the action is pending', async () => {
    let resolve;
    const action = () => new Promise((r) => { resolve = r; });
    const { result } = renderHook(() => useAsyncAction(vi.fn()));
    act(() => { result.current.run('id-1', action, vi.fn()); });
    expect(result.current.busy).toBe('id-1');
    await act(async () => { resolve({}); });
    expect(result.current.busy).toBeNull();
  });

  it('calls onSuccess with the resolved value', async () => {
    const onSuccess = vi.fn();
    const action = () => Promise.resolve({ ok: true });
    const { result } = renderHook(() => useAsyncAction(vi.fn()));
    await act(async () => { result.current.run('id-1', action, onSuccess); });
    expect(onSuccess).toHaveBeenCalledWith({ ok: true });
  });

  it('uses the default fallback when a failure has no message', async () => {
    const setError = vi.fn();
    const action = () => Promise.reject({});
    const { result } = renderHook(() => useAsyncAction(setError));
    await act(async () => { result.current.run('id-1', action, vi.fn()); });
    expect(setError).toHaveBeenCalledWith('Action failed.');
  });

  it('calls setError with the error message on failure', async () => {
    const setError = vi.fn();
    const action = () => Promise.reject(new Error('Network error'));
    const { result } = renderHook(() => useAsyncAction(setError));
    await act(async () => { result.current.run('id-1', action, vi.fn()); });
    expect(setError).toHaveBeenCalledWith('Network error');
  });

  it('uses the fallback message when error has no message', async () => {
    const setError = vi.fn();
    const action = () => Promise.reject({});
    const { result } = renderHook(() => useAsyncAction(setError));
    await act(async () => { result.current.run('id-1', action, vi.fn(), 'Fallback error.'); });
    expect(setError).toHaveBeenCalledWith('Fallback error.');
  });

  it('resets busy to null after a failure', async () => {
    const action = () => Promise.reject(new Error('oops'));
    const { result } = renderHook(() => useAsyncAction(vi.fn()));
    await act(async () => { result.current.run('id-1', action, vi.fn()); });
    expect(result.current.busy).toBeNull();
  });
});

describe('useAsyncList', () => {
  it('starts in a loading state', async () => {
    let resolve;
    const fetcher = vi.fn(() => new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useAsyncList(fetcher, 'Failed.'));
    expect(result.current.loading).toBe(true);
    await act(async () => { resolve([]); });
  });

  it('populates items on successful fetch', async () => {
    const fetcher = vi.fn(() => Promise.resolve([{ id: 1 }]));
    const { result } = renderHook(() => useAsyncList(fetcher, 'Failed.'));
    await act(async () => {});
    expect(result.current.items).toEqual([{ id: 1 }]);
    expect(result.current.loading).toBe(false);
  });

  it('sets error message on fetch failure', async () => {
    const fetcher = vi.fn(() => Promise.reject(new Error('Server down')));
    const { result } = renderHook(() => useAsyncList(fetcher, 'Failed.'));
    await act(async () => {});
    expect(result.current.error).toBe('Server down');
  });

  it('uses fallback error message when error has no message', async () => {
    const fetcher = vi.fn(() => Promise.reject({}));
    const { result } = renderHook(() => useAsyncList(fetcher, 'Custom fallback.'));
    await act(async () => {});
    expect(result.current.error).toBe('Custom fallback.');
  });

  it('exposes setItems for local state updates', async () => {
    const fetcher = vi.fn(() => Promise.resolve([]));
    const { result } = renderHook(() => useAsyncList(fetcher, ''));
    await act(async () => {});
    act(() => { result.current.setItems([{ id: 99 }]); });
    expect(result.current.items).toEqual([{ id: 99 }]);
  });

  it('exposes setError and clears old errors when a later fetch succeeds', async () => {
    let shouldFail = true;
    const makeFetcher = () => vi.fn(() => (
      shouldFail
        ? Promise.reject(new Error('Boom'))
        : Promise.resolve([{ id: 7 }])
    ));

    const { result, rerender } = renderHook(
      ({ currentFetcher }) => useAsyncList(currentFetcher, 'Failed.'),
      { initialProps: { currentFetcher: makeFetcher() } },
    );

    await act(async () => {});
    expect(result.current.error).toBe('Boom');

    act(() => { result.current.setError('Manual error'); });
    expect(result.current.error).toBe('Manual error');

    shouldFail = false;
    rerender({ currentFetcher: makeFetcher() });
    await act(async () => {});

    expect(result.current.error).toBe('');
    expect(result.current.items).toEqual([{ id: 7 }]);
  });
});

describe('usePaginatedItems', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

  it('starts on page 1', () => {
    const { result } = renderHook(() => usePaginatedItems(items, 10));
    expect(result.current.currentPage).toBe(1);
  });

  it('returns only one page of items', () => {
    const { result } = renderHook(() => usePaginatedItems(items, 10));
    expect(result.current.pageItems).toHaveLength(10);
  });

  it('calculates total pages correctly', () => {
    const { result } = renderHook(() => usePaginatedItems(items, 10));
    expect(result.current.totalPages).toBe(3);
  });

  it('shows correct items when navigating to page 2', () => {
    const { result } = renderHook(() => usePaginatedItems(items, 10));
    act(() => { result.current.setCurrentPage(2); });
    expect(result.current.pageItems[0].id).toBe(11);
  });

  it('resets to page 1 when items change and current page exceeds total', () => {
    const { result, rerender } = renderHook(
      ({ data, size }) => usePaginatedItems(data, size),
      { initialProps: { data: items, size: 10 } },
    );
    act(() => { result.current.setCurrentPage(3); });
    rerender({ data: items.slice(0, 5), size: 10 });
    expect(result.current.currentPage).toBe(1);
  });

  it('returns at least 1 total page for an empty items array', () => {
    const { result } = renderHook(() => usePaginatedItems([], 10));
    expect(result.current.totalPages).toBe(1);
  });

  it('handles null items gracefully', () => {
    const { result } = renderHook(() => usePaginatedItems(null, 10));
    expect(result.current.pageItems).toEqual([]);
    expect(result.current.totalPages).toBe(1);
  });
});

describe('useUsersTabState', () => {
  it('loads users and exposes update controls', async () => {
    fetchAdminUsers.mockResolvedValueOnce([{ id: 1, username: 'alice' }]);

    const { result } = renderHook(() => useUsersTabState());

    await act(async () => {});

    expect(result.current.users).toEqual([{ id: 1, username: 'alice' }]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.filters).toEqual({ roles: [], status: [] });
  });

  it('falls back to the default error message when loading users fails without a message', async () => {
    fetchAdminUsers.mockRejectedValueOnce({});

    const { result } = renderHook(() => useUsersTabState());

    await act(async () => {});

    expect(result.current.error).toBe('Failed to load users.');
    expect(result.current.loading).toBe(false);
  });
});
