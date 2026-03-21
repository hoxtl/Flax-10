<<<<<<< HEAD
/*
 * Course change requests admin tab.
 */

import { fetchCourseChangeRequests, resolveCourseChangeRequest } from "../../../api/adminApi";
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import styles from "../styles";
import { ADMIN_LIST_PAGE_SIZE } from "../constants";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAsyncList } from "../hooks/useAsyncList";
import { usePaginatedItems } from "../hooks/usePaginatedItems";
import { navigateToProfile } from "../utils/adminNavigation";
import { AnimatedList, ListActions, ListInfo, ListRow } from "./AdminList";
import AdminPagination from "./AdminPagination";
import { CardHeader, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";

function DecisionButtons({ busy, onApprove, onReject }) {
  return <><button className={styles.approveBtn} disabled={busy} onClick={onApprove}>✓ Approve</button><button className={styles.rejectBtn} disabled={busy} onClick={onReject}>✗ Reject</button></>;
}

function getCourseMeta(request) {
  return request.current_course ? `${request.current_course} → ${request.requested_course}` : `Requesting: ${request.requested_course}`;
}

function getCourseCursor(request) {
  return request.user_id ? "pointer" : "default";
}

function CourseChangeRow({ busy, onDecide, onNavigate, request }) {
  const stopAndDecide = (event, decision) => { event.stopPropagation(); onDecide(request.id, decision); };
  return (
    <ListRow onClick={() => navigateToProfile(onNavigate, request.user_id)} style={{ cursor: getCourseCursor(request) }}>
      <ListInfo name={`${request.first_name} ${request.last_name}`} meta={`@${request.username} · ${request.email}`} extraMeta={getCourseMeta(request)} />
      <ListActions><DecisionButtons busy={busy === request.id} onApprove={(event) => stopAndDecide(event, "approve")} onReject={(event) => stopAndDecide(event, "reject")} /></ListActions>
    </ListRow>
  );
}

function CourseChangesContent({ busy, onDecide, onNavigate, pagination }) {
  return (
    <>
      <AdminPagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} />
      <AnimatedList items={pagination.pageItems} renderItem={(request) => <CourseChangeRow key={request.id} request={request} busy={busy} onNavigate={onNavigate} onDecide={onDecide} />} />
    </>
=======
/** Admin tab for managing course change requests. */
import { motion } from "framer-motion";
import { Pagination } from "../../../components/Pagination/Pagination";
import { fetchCourseChangeRequests, resolveCourseChangeRequest } from "../../../api/adminApi";
import { useAsyncList, usePaginatedItems, useAsyncAction, stagger, rowAnim } from "../hooks/useAdminData";
import { AdminListSection, AnimatedList, ListInfo, ListActions, ApproveRejectButtons } from "./AdminUI";
import styles from "../AdminPage.module.css";

function CourseChangeRow({ request, busy, onNavigate, onDecide }) {
  const handleClick = () => { if (request.user_id) onNavigate?.(`profile_${request.user_id}`); };
  const courseMeta = request.current_course ? `${request.current_course} → ${request.requested_course}` : `Requesting: ${request.requested_course}`;
  const stopAndDecide = (e, decision) => { e.stopPropagation(); onDecide(request.id, decision); };
  return (
    <motion.div className={styles.listRow} variants={rowAnim} layout onClick={handleClick} style={{ cursor: request.user_id ? "pointer" : "default" }}>
      <ListInfo name={`${request.first_name} ${request.last_name}`} meta={`@${request.username} · ${request.email}`} extraMeta={courseMeta} />
      <ListActions><ApproveRejectButtons busy={busy === request.id} onApprove={(e) => stopAndDecide(e, "approve")} onReject={(e) => stopAndDecide(e, "reject")} /></ListActions>
    </motion.div>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  );
}

export default function CourseChangeRequestsTab({ onNavigate }) {
<<<<<<< HEAD
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
=======
  const { items, setItems, loading, error, setError } = useAsyncList(fetchCourseChangeRequests);
  const { currentPage, setCurrentPage, totalPages, pageItems } = usePaginatedItems(items);
  const { busy, execute } = useAsyncAction(setError);
  const decide = (id, decision) => execute(id, () => resolveCourseChangeRequest(id, decision), () => setItems((p) => p.filter((r) => r.id !== id)));
  const pagination = <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />;
  const renderRow = (r) => <CourseChangeRow key={r.id} request={r} busy={busy} onNavigate={onNavigate} onDecide={decide} />;
  return (
    <AdminListSection title="Course Change Requests" count={items.length} error={error} loading={loading} isEmpty={items.length === 0} emptyMessage="No pending course change requests." pagination={pagination}>
      <AnimatedList items={pageItems} renderItem={renderRow} stagger={stagger} />
    </AdminListSection>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  );
}
