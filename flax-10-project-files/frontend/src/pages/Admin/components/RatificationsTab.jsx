/*
 * Society ratifications admin tab.
 */

import { fetchPendingRatifications, approveRatification, rejectRatification } from "../../../api/adminApi";
import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";
import { ADMIN_LIST_PAGE_SIZE } from "../constants";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAsyncList } from "../hooks/useAsyncList";
import { usePaginatedItems } from "../hooks/usePaginatedItems";
import { navigateToSociety } from "../utils/adminNavigation";
import { ListActions, AnimatedList, ListInfo, ListRow } from "./AdminList";
import AdminDecisionButtons from "./AdminDecisionButtons";
import AdminPagination from "./AdminPagination";
import { CardHeader, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";

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
      <ListActions><AdminDecisionButtons busy={busy === item.id} onApprove={(event) => stopAndDecide(event, "approve")} onReject={(event) => stopAndDecide(event, "reject")} /></ListActions>
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
  );
}
