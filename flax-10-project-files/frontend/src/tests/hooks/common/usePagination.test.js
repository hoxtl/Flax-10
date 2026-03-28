import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../../../hooks/usePagination';

describe('usePagination', () => {
    it('returns first page of items by default', () => {
        const items = [1, 2, 3, 4, 5];
        const { result } = renderHook(() => usePagination(items, 2));
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalPages).toBe(3);
        expect(result.current.currentItems).toEqual([1, 2]);
    });

    it('setPage changes current page and currentItems', () => {
        const items = [1, 2, 3, 4, 5];
        const { result } = renderHook(() => usePagination(items, 2));
        act(() => { result.current.setPage(2); });
        expect(result.current.currentPage).toBe(2);
        expect(result.current.currentItems).toEqual([3, 4]);
    });

    it('resets to page 1 when items shrink and current page is out of bounds', () => {
        const { result, rerender } = renderHook(
            ({ items, pageSize }) => usePagination(items, pageSize),
            { initialProps: { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], pageSize: 2 } }
        );
        act(() => { result.current.setPage(4); });
        expect(result.current.currentPage).toBe(4);
        expect(result.current.totalPages).toBe(5);
        rerender({ items: [1, 2], pageSize: 2 });
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.currentItems).toEqual([1, 2]);
    });
});
