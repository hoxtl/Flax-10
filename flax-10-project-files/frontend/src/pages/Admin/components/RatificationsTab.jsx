<<<<<<< HEAD
/*
 * Society ratifications admin tab.
 */

import { fetchPendingRatifications, approveRatification, rejectRatification } from "../../../api/adminApi";
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import { ADMIN_LIST_PAGE_SIZE } from "../constants";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAsyncList } from "../hooks/useAsyncList";
import { usePaginatedItems } from "../hooks/usePaginatedItems";
import { navigateToSociety } from "../utils/adminNavigation";
import { ListActions, AnimatedList, ListInfo, ListRow } from "./AdminList";
import AdminPagination from "./AdminPagination";
import { CardHeader, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";
import styles from "../styles";

function DecisionButtons({ busy, onApprove, onReject }) {
  return <><button className={styles.approveBtn} disabled={busy} onClick={onApprove}>✓ Approve</button><button className={styles.rejectBtn} disabled={busy} onClick={onReject}>✗ Reject</button></>;
}

function getRatificationMeta(item) {
  return `${item.member_count ?? 0} members${item.description ? ` · ${item.description.slice(0, 80)}…` : ""}`;
=======
/** Admin tab for managing pending society ratifications. */
import { motion } from "framer-motion";
import { Pagination } from "../../../components/Pagination/Pagination";
import { fetchPendingRatifications, approveRatification, rejectRatification } from "../../../api/adminApi";
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function resolveRatification(id, action) {
  return action === "approve" ? approveRatification(id) : rejectRatification(id);
}

<<<<<<< HEAD
function RatificationRow({ busy, item, onDecide }) {
  const stopAndDecide = (event, action) => { event.stopPropagation(); onDecide(item.id, action); };
  return (
    <ListRow onClick={() => navigateToSociety(item.society_id ?? item.id)} style={{ cursor: "pointer" }}>
      <ListInfo name={item.name} meta={getRatificationMeta(item)} />
      <ListActions><DecisionButtons busy={busy === item.id} onApprove={(event) => stopAndDecide(event, "approve")} onReject={(event) => stopAndDecide(event, "reject")} /></ListActions>
    </ListRow>
  );
}

function RatificationsContent({ busy, onDecide, pagination }) {
  return (
    <>
      <AdminPagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} />
      <AnimatedList items={pagination.pageItems} renderItem={(item) => <RatificationRow key={item.id} item={item} busy={busy} onDecide={onDecide} />} />
    </>
  );
}

export default function RatificationsTab() {
  const { error, items, loading, setError, setItems } = useAsyncList(fetchPendingRatifications, "Failed to load ratifications.");
  const { busy, run } = useAsyncAction(setError);
  const pagination = usePaginatedItems(items, ADMIN_LIST_PAGE_SIZE);
  const decide = (id, action) => run(id, () => resolveRatification(id, action), () => setItems((current) => current.filter((item) => item.id !== id)));
  return (
    <SectionCard>
      <CardHeader title="Society Ratifications" count={items.length} />
      <ErrorMessage message={error} />
      {loading ? <LoadingSpinner /> : items.length ? <RatificationsContent busy={busy} onDecide={decide} pagination={pagination} /> : <SearchEmptyState title="No societies awaiting ratification" hint="New society ratification requests will appear here." />}
    </SectionCard>
=======
export default function RatificationsTab() {
  const { items, setItems, loading, error, setError } = useAsyncList(fetchPendingRatifications);
  const { currentPage, setCurrentPage, totalPages, pageItems } = usePaginatedItems(items);
  const { busy, execute } = useAsyncAction(setError);
  const decide = (id, action) => execute(id, () => resolveRatification(id, action), () => setItems((p) => p.filter((s) => s.id !== id)));
  const pagination = <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />;
  const renderRow = (s) => <RatificationRow key={s.id} item={s} busy={busy} onDecide={decide} />;
  return (
    <AdminListSection title="Pending Ratifications" count={items.length} error={error} loading={loading} isEmpty={items.length === 0} emptyMessage="No societies are awaiting ratification." pagination={pagination}>
      <AnimatedList items={pageItems} renderItem={renderRow} stagger={stagger} />
    </AdminListSection>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  );
}
