/*
 * Course change requests admin tab.
 */

import { fetchCourseChangeRequests, resolveCourseChangeRequest } from "../../../api/adminApi";
<<<<<<< HEAD
import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";
=======
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import styles from "../styles";
>>>>>>> origin/main
import { ADMIN_LIST_PAGE_SIZE } from "../constants";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAsyncList } from "../hooks/useAsyncList";
import { usePaginatedItems } from "../hooks/usePaginatedItems";
import { navigateToProfile } from "../utils/adminNavigation";
import { AnimatedList, DecisionListRow } from "./AdminList";
import AdminPagination from "./AdminPagination";
import { CardHeader, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";

function getCourseMeta(request) {
  return request.current_course ? `${request.current_course} → ${request.requested_course}` : `Requesting: ${request.requested_course}`;
}

function getCourseCursor(request) {
  return request.user_id ? "pointer" : "default";
}

function CourseChangeRow({ busy, onDecide, onNavigate, request }) {
  return (
    <DecisionListRow
      busy={busy}
      cursor={getCourseCursor(request)}
      extraMeta={getCourseMeta(request)}
      id={request.id}
      meta={`@${request.username} · ${request.email}`}
      name={`${request.first_name} ${request.last_name}`}
      navigate={() => navigateToProfile(onNavigate, request.user_id)}
      onDecide={onDecide}
    />
  );
}

function CourseChangesContent({ busy, onDecide, onNavigate, pagination }) {
  return (
    <>
      <AdminPagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} />
      <AnimatedList items={pagination.pageItems} renderItem={(request) => <CourseChangeRow key={request.id} request={request} busy={busy} onNavigate={onNavigate} onDecide={onDecide} />} />
    </>
  );
}

export default function CourseChangeRequestsTab({ onNavigate }) {
  const { error, items, loading, setError, setItems } = useAsyncList(fetchCourseChangeRequests, "Failed to load course change requests.");
  const { busy, run } = useAsyncAction(setError);
  const pagination = usePaginatedItems(items, ADMIN_LIST_PAGE_SIZE);
  const decide = (id, decision) => run(id, () => resolveCourseChangeRequest(id, decision), () => setItems((current) => current.filter((request) => request.id !== id)));
  return (
    <SectionCard>
      <CardHeader title="Course Switch Requests" count={items.length} />
      <ErrorMessage message={error} />
      {loading ? <LoadingSpinner /> : items.length ? <CourseChangesContent busy={busy} onDecide={decide} onNavigate={onNavigate} pagination={pagination} /> : <SearchEmptyState title="No course switch requests" hint="Student course change requests will appear here." />}
    </SectionCard>
  );
}
