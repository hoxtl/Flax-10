import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_PAGE_SIZE = 12;

export function useInfiniteScroll(items, pageSize = DEFAULT_PAGE_SIZE) {
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const [pageBreaks, setPageBreaks] = useState([0]);
    const observerRef = useRef(null);
    const sentinelRef = useRef(null);

    const visibleItems = items.slice(0, visibleCount);
    const hasMore = visibleCount < items.length;

    const loadMore = useCallback(() => {
        if (!hasMore) return;
        setPageBreaks(prev => [...prev, visibleCount]);
        setVisibleCount(prev => Math.min(prev + pageSize, items.length));
    }, [hasMore, pageSize, items.length, visibleCount]);

    const reset = useCallback(() => {
        setVisibleCount(pageSize);
        setPageBreaks([0]);
    }, [pageSize]);

    useEffect(() => { reset(); }, [items.length, reset]);

    useEffect(() => {
        observerRef.current = createObserver(loadMore);
        if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
        return () => observerRef.current?.disconnect();
    }, [loadMore]);

    return { visibleItems, hasMore, sentinelRef, pageBreaks, reset };
}

function createObserver(callback) {
    return new IntersectionObserver(
        entries => entries[0]?.isIntersecting && callback(),
        { rootMargin: "200px" }
    );
}
