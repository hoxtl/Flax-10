import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearchFilter } from '../../../hooks/useSearchFilter';

describe('useSearchFilter', () => {
    it('returns items when searchQuery is empty', () => {
        const items = [{ id: 1, name: 'Foo' }];
        const { result } = renderHook(() => useSearchFilter(items, '', ['name']));
        expect(result.current).toEqual(items);
    });

    it('returns empty array when items is null/undefined and no query', () => {
        const { result } = renderHook(() => useSearchFilter(null, '', ['name']));
        expect(result.current).toEqual([]);
    });

    it('returns items as-is when items is null and query is set', () => {
        const { result } = renderHook(() => useSearchFilter(null, 'x', ['name']));
        expect(result.current).toEqual([]);
    });

    it('filters items by single search key (string match)', () => {
        const items = [
            { id: 1, name: 'Apple' },
            { id: 2, name: 'Banana' },
            { id: 3, name: 'Apricot' },
        ];
        const { result } = renderHook(() => useSearchFilter(items, 'ap', ['name']));
        expect(result.current).toHaveLength(2);
        expect(result.current.map(i => i.name)).toEqual(['Apple', 'Apricot']);
    });

    it('filters case-insensitively', () => {
        const items = [{ id: 1, name: 'UPPERCASE' }];
        const { result } = renderHook(() => useSearchFilter(items, 'upper', ['name']));
        expect(result.current).toHaveLength(1);
        expect(result.current[0].name).toBe('UPPERCASE');
    });

    it('matches on any of the search keys', () => {
        const items = [
            { id: 1, name: 'No', code: 'ABC' },
            { id: 2, name: 'Yes', code: 'XYZ' },
        ];
        const { result } = renderHook(() => useSearchFilter(items, 'xy', ['name', 'code']));
        expect(result.current).toHaveLength(1);
        expect(result.current[0].code).toBe('XYZ');
    });

    it('ignores non-string values in item', () => {
        const items = [
            { id: 1, name: 'Foo', count: 42 },
        ];
        const { result } = renderHook(() => useSearchFilter(items, '42', ['name', 'count']));
        expect(result.current).toHaveLength(0);
    });

    it('ignores falsy key values', () => {
        const items = [
            { id: 1, name: null },
            { id: 2, name: '' },
        ];
        const { result } = renderHook(() => useSearchFilter(items, 'x', ['name']));
        expect(result.current).toHaveLength(0);
    });
});
