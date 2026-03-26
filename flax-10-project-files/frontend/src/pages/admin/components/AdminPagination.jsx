/*
 * Shared admin pagination wrapper.
 */

import { Pagination } from "../../../components/Pagination/Pagination";

export default function AdminPagination({ currentPage, onPageChange, totalPages }) {
  return <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />;
}
