/*
 * Hook for paginating admin lists.
 */

import { useEffect, useMemo, useState } from "react";

function getPageCount(items, pageSize) {
  return Math.max(1, Math.ceil((items?.length || 0) / pageSize));
}

function getPageItems(items, currentPage, pageSize) {
  const start = (currentPage - 1) * pageSize;
  return (items || []).slice(start, start + pageSize);
}

export function usePaginatedItems(items, pageSize) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(() => getPageCount(items, pageSize), [items, pageSize]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [currentPage, totalPages]);
  const pageItems = useMemo(() => getPageItems(items, currentPage, pageSize), [currentPage, items, pageSize]);
  return { currentPage, pageItems, setCurrentPage, totalPages };
}
