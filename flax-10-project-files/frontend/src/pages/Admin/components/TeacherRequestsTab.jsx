/*
 * Teacher request admin tab.
 */

import { fetchTeacherRequests, resolveTeacherRequest } from "../../../api/adminApi";
import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";
import styles from "../styles";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAsyncList } from "../hooks/useAsyncList";
import { navigateToProfile } from "../utils/adminNavigation";
import { AnimatedList, ListActions, ListInfo, ListRow } from "./AdminList";
import { CardHeader, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";

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

function TeacherRequestsContent({ busy, items, onDecide, onNavigate }) {
  return <AnimatedList items={items} renderItem={(user) => <TeacherRequestRow key={user.id} user={user} busy={busy} onNavigate={onNavigate} onDecide={onDecide} />} />;
}

export default function TeacherRequestsTab({ onNavigate }) {
  const { error, items, loading, setError, setItems } = useAsyncList(fetchTeacherRequests, "Failed to load teacher requests.");
  const { busy, run } = useAsyncAction(setError);
  const decide = (id, decision) => run(id, () => resolveTeacherRequest(id, decision), () => setItems((current) => current.filter((user) => user.id !== id)));
  return (
    <SectionCard>
      <CardHeader title="Teacher Switch Requests" count={items.length} />
      <ErrorMessage message={error} />
      {loading ? <LoadingSpinner /> : items.length ? <TeacherRequestsContent items={items} busy={busy} onNavigate={onNavigate} onDecide={decide} /> : <SearchEmptyState title="No teacher switch requests" hint="Teacher role requests from students will appear here." />}
    </SectionCard>
  );
}
