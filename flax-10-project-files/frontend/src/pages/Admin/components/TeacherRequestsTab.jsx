/** Admin tab for managing teacher role requests. */
import { motion } from "framer-motion";
import { Pagination } from "../../../components/Pagination/Pagination";
import { fetchTeacherRequests, resolveTeacherRequest } from "../../../api/admin/adminApi";
import { useAsyncList, usePaginatedItems, useAsyncAction, stagger, rowAnim } from "../hooks/useAdminData";
import { AdminListSection, AnimatedList, ListInfo, ListActions, ApproveRejectButtons } from "./AdminUI";
import styles from "../AdminPage.module.css";

function TeacherRequestRow({ user, busy, onNavigate, onDecide }) {
  const handleClick = () => onNavigate?.(`profile_${user.id}`);
  const stopAndDecide = (e, decision) => { e.stopPropagation(); onDecide(user.id, decision); };
  return (
    <motion.div className={styles.listRow} variants={rowAnim} layout onClick={handleClick} style={{ cursor: "pointer" }}>
      <ListInfo name={`${user.first_name} ${user.last_name}`} meta={`@${user.username} · ${user.email}`} />
      <ListActions><ApproveRejectButtons busy={busy === user.id} onApprove={(e) => stopAndDecide(e, "approve")} onReject={(e) => stopAndDecide(e, "reject")} /></ListActions>
    </motion.div>
  );
}

export default function TeacherRequestsTab({ onNavigate }) {
  const { items, setItems, loading, error, setError } = useAsyncList(fetchTeacherRequests);
  const { currentPage, setCurrentPage, totalPages, pageItems } = usePaginatedItems(items);
  const { busy, execute } = useAsyncAction(setError);
  const decide = (id, decision) => execute(id, () => resolveTeacherRequest(id, decision), () => setItems((p) => p.filter((u) => u.id !== id)));
  const pagination = <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />;
  const renderRow = (u) => <TeacherRequestRow key={u.id} user={u} busy={busy} onNavigate={onNavigate} onDecide={decide} />;
  return (
    <AdminListSection title="Teacher Role Requests" count={items.length} error={error} loading={loading} isEmpty={items.length === 0} emptyMessage="No pending teacher role requests." pagination={pagination}>
      <AnimatedList items={pageItems} renderItem={renderRow} stagger={stagger} />
    </AdminListSection>
  );
}
