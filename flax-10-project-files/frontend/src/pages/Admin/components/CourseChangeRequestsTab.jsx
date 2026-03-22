/** Admin tab for managing course change requests. */
import { motion } from "framer-motion";
import { Pagination } from "../../../components/Pagination/Pagination";
import { fetchCourseChangeRequests, resolveCourseChangeRequest } from "../../../api/admin/adminApi";
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
  );
}

export default function CourseChangeRequestsTab({ onNavigate }) {
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
  );
}
