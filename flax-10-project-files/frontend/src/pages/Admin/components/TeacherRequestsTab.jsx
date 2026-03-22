/*
 * Teacher request admin tab.
 */

import { fetchTeacherRequests, resolveTeacherRequest } from "../../../api/adminApi";
import styles from "../AdminPage.module.css";
import { ADMIN_LIST_PAGE_SIZE, EMPTY_MESSAGES } from "../constants";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAsyncList } from "../hooks/useAsyncList";
import { usePaginatedItems } from "../hooks/usePaginatedItems";
import { navigateToProfile } from "../utils/adminNavigation";
import AdminPagination from "./AdminPagination";
import { AnimatedList, ListActions, ListInfo, ListRow } from "./AdminList";
import { CardHeader, EmptyMessage, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";

function DecisionButtons({ busy, onApprove, onReject }) {
  return <><button className={styles.approveBtn} disabled={busy} onClick={onApprove}>✓ Approve</button><button className={styles.rejectBtn} disabled={busy} onClick={onReject}>✗ Reject</button></>;
}

function TeacherRequestRow({ busy, onDecide, onNavigate, user }) {
  const stopAndDecide = (event, decision) => { event.stopPropagation(); onDecide(user.id, decision); };
  return (
    <ListRow onClick={() => navigateToProfile(onNavigate, user.id)} style={{ cursor: "pointer" }}>
      <ListInfo name={`${user.first_name} ${user.last_name}`} meta={`@${user.username} · ${user.email}`} />
      <ListActions><DecisionButtons busy={busy === user.id} onApprove={(event) => stopAndDecide(event, "approve")} onReject={(event) => stopAndDecide(event, "reject")} /></ListActions>
    </ListRow>
  );
}

function TeacherRequestsContent({ busy, items, onDecide, onNavigate, pagination }) {
  return (
    <>
      <AdminPagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} />
      <AnimatedList items={pagination.pageItems} renderItem={(user) => <TeacherRequestRow key={user.id} user={user} busy={busy} onNavigate={onNavigate} onDecide={onDecide} />} />
    </>
  );
}

export default function TeacherRequestsTab({ onNavigate }) {
  const { error, items, loading, setError, setItems } = useAsyncList(fetchTeacherRequests, "Failed to load teacher requests.");
  const pagination = usePaginatedItems(items, ADMIN_LIST_PAGE_SIZE);
  const { busy, run } = useAsyncAction(setError);
  const decide = (id, decision) => run(id, () => resolveTeacherRequest(id, decision), () => setItems((current) => current.filter((user) => user.id !== id)));
  return (
    <SectionCard>
      <CardHeader title="Teacher Switch Requests" count={items.length} />
      <ErrorMessage message={error} />
      {loading ? <LoadingSpinner /> : items.length ? <TeacherRequestsContent items={items} busy={busy} onNavigate={onNavigate} onDecide={decide} pagination={pagination} /> : <EmptyMessage>{EMPTY_MESSAGES.teachers}</EmptyMessage>}
    </SectionCard>
  );
}
