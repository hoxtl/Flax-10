/*
 * Society ratifications admin tab.
 */

import { fetchPendingRatifications, approveRatification, rejectRatification } from "../../../api/adminApi";
import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAsyncList } from "../hooks/useAsyncList";
import { navigateToSociety } from "../utils/adminNavigation";
import { ListActions, AnimatedList, ListInfo, ListRow } from "./AdminList";
import { CardHeader, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";
import styles from "../styles";

function DecisionButtons({ busy, onApprove, onReject }) {
  return <><button className={styles.approveBtn} disabled={busy} onClick={onApprove}>✓ Approve</button><button className={styles.rejectBtn} disabled={busy} onClick={onReject}>✗ Reject</button></>;
}

function getRatificationMeta(item) {
  return `${item.member_count ?? 0} members${item.description ? ` · ${item.description.slice(0, 80)}…` : ""}`;
}

function resolveRatification(id, action) {
  return action === "approve" ? approveRatification(id) : rejectRatification(id);
}

function RatificationRow({ busy, item, onDecide }) {
  const stopAndDecide = (event, action) => { event.stopPropagation(); onDecide(item.id, action); };
  return (
    <ListRow onClick={() => navigateToSociety(item.society_id ?? item.id)} style={{ cursor: "pointer" }}>
      <ListInfo name={item.name} meta={getRatificationMeta(item)} />
      <ListActions><DecisionButtons busy={busy === item.id} onApprove={(event) => stopAndDecide(event, "approve")} onReject={(event) => stopAndDecide(event, "reject")} /></ListActions>
    </ListRow>
  );
}

function RatificationsContent({ busy, items, onDecide }) {
  return <AnimatedList items={items} renderItem={(item) => <RatificationRow key={item.id} item={item} busy={busy} onDecide={onDecide} />} />;
}

export default function RatificationsTab() {
  const { error, items, loading, setError, setItems } = useAsyncList(fetchPendingRatifications, "Failed to load ratifications.");
  const { busy, run } = useAsyncAction(setError);
  const decide = (id, action) => run(id, () => resolveRatification(id, action), () => setItems((current) => current.filter((item) => item.id !== id)));
  return (
    <SectionCard>
      <CardHeader title="Society Ratifications" count={items.length} />
      <ErrorMessage message={error} />
      {loading ? <LoadingSpinner /> : items.length ? <RatificationsContent items={items} busy={busy} onDecide={decide} /> : <SearchEmptyState title="No societies awaiting ratification" hint="New society ratification requests will appear here." />}
    </SectionCard>
  );
}
