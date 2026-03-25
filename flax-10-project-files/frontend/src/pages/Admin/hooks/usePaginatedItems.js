/*
 * Hook for paginating admin lists.
 */

import { useMemo, useState } from "react";

function getPageCount(items, pageSize) {
  return Math.max(1, Math.ceil((items?.length || 0) / pageSize));
}

function getPageItems(items, currentPage, pageSize) {
  const start = (currentPage - 1) * pageSize;
  return (items || []).slice(start, start + pageSize);
}

function clampPage(page, totalPages) {
  return Math.min(Math.max(page, 1), totalPages);
}

export function usePaginatedItems(items, pageSize) {
  const [requestedPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(() => getPageCount(items, pageSize), [items, pageSize]);
  const currentPage = useMemo(() => clampPage(requestedPage, totalPages), [requestedPage, totalPages]);
  const pageItems = useMemo(() => getPageItems(items, currentPage, pageSize), [currentPage, items, pageSize]);
  return { currentPage, pageItems, setCurrentPage, totalPages };
}
