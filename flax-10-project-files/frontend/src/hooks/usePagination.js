import { useState, useMemo } from 'react';

/**
 * Custom hook for pagination logic.
 * @param {Array} items - The full list of items to paginate.
 * @param {number} pageSize - Number of items per page.
 * @param {number} initialPage - Initial page number (default 1).
 * @returns {Object} { currentItems, totalPages, currentPage, setPage }
 */
export function usePagination(items, pageSize, initialPage = 1) {
    const [currentPage, setPage] = useState(initialPage);

    const totalPages = Math.ceil(items.length / pageSize);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, currentPage, pageSize]);

    // Reset to page 1 if search/filters change and current page is out of bounds
    useMemo(() => {
        if (currentPage > 1 && currentPage > totalPages) {
            setPage(1);
        }
    }, [totalPages, currentPage]);

    return { currentItems, totalPages, currentPage, setPage };
}
