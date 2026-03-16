import { useMemo } from 'react';

export function useSearchFilter(items, searchQuery, searchKeys) {
    return useMemo(() => {
        if (!searchQuery || !items) return items || [];
        const lowerQ = searchQuery.toLowerCase();

        return items.filter(item => {
            return searchKeys.some(key => {
                const val = item[key];
                return val && typeof val === 'string' && val.toLowerCase().includes(lowerQ);
            });
        });
    }, [items, searchQuery, searchKeys]);
}
