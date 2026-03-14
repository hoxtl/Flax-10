import { useState, useMemo, useEffect, useCallback } from 'react';

/**
 * Custom hook for pagination logic.
 * @param {Array} items - The full list of items to paginate.
 * @param {number} pageSize - Number of items per page.
 * @param {number} initialPage - Initial page number (default 1).
 * @returns {Object} { currentItems, totalPages, currentPage, setPage }
 */
export function usePagination(items, pageSize, initialPage = 1) {
    const [currentPage, setPageInternal] = useState(initialPage);
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);

    const currentItems = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, safePage, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages) setPageInternal(1);
    }, [totalPages, currentPage]);

    const setPage = useCallback((page) => {
        setPageInternal(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    return { currentItems, totalPages, currentPage: safePage, setPage };
}
