/** Admin tab for managing pending society ratifications. */
import { motion } from "framer-motion";
import { Pagination } from "../../../components/Pagination/Pagination";
import { fetchPendingRatifications, approveRatification, rejectRatification } from "../../../api/admin/adminApi";
import { useAsyncList, usePaginatedItems, useAsyncAction, stagger, rowAnim } from "../hooks/useAdminData";
import { AdminListSection, AnimatedList, ListInfo, ListActions, ApproveRejectButtons } from "./AdminUI";
import styles from "../AdminPage.module.css";

function navigateToSociety(societyId) {
  window.dispatchEvent(new CustomEvent("navigate", { detail: `societies_${societyId}` }));
}

function RatificationRow({ item, busy, onDecide }) {
  const handleClick = () => navigateToSociety(item.society_id ?? item.id);
  const meta = `${item.member_count ?? 0} members${item.description ? ` · ${item.description.slice(0, 80)}…` : ""}`;
  const stopAndDecide = (e, action) => { e.stopPropagation(); onDecide(item.id, action); };
  return (
    <motion.div className={styles.listRow} variants={rowAnim} layout onClick={handleClick} style={{ cursor: "pointer" }}>
      <ListInfo name={item.name} meta={meta} />
      <ListActions><ApproveRejectButtons busy={busy === item.id} onApprove={(e) => stopAndDecide(e, "approve")} onReject={(e) => stopAndDecide(e, "reject")} /></ListActions>
    </motion.div>
  );
}

function resolveRatification(id, action) {
  return action === "approve" ? approveRatification(id) : rejectRatification(id);
}

export default function RatificationsTab() {
  const { items, setItems, loading, error, setError } = useAsyncList(fetchPendingRatifications);
  const { currentPage, setCurrentPage, totalPages, pageItems } = usePaginatedItems(items, 10);
  const { busy, execute } = useAsyncAction(setError);
  const decide = (id, action) => execute(id, () => resolveRatification(id, action), () => setItems((p) => p.filter((s) => s.id !== id)));
  const pagination = <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />;
  const renderRow = (s) => <RatificationRow key={s.id} item={s} busy={busy} onDecide={decide} />;
  return (
    <AdminListSection title="Pending Ratifications" count={items.length} error={error} loading={loading} isEmpty={items.length === 0} emptyMessage="No societies are awaiting ratification." pagination={pagination}>
      <AnimatedList items={pageItems} renderItem={renderRow} stagger={stagger} />
    </AdminListSection>
  );
}
