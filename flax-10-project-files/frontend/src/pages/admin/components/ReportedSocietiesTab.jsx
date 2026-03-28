/*
 * Reported societies admin tab.
 */

import { useState } from "react";
import { banReportedSociety, dismissReport, fetchReportedSocieties } from "../../../api/adminApi";
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import styles from "../styles/styles";
import { ADMIN_LIST_PAGE_SIZE } from "../utils/constants";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAsyncList } from "../hooks/useAsyncList";
import { usePaginatedItems } from "../hooks/usePaginatedItems";
import { navigateToSociety } from "../utils/adminNavigation";
import { AnimatedList, ListActions, ListInfo, ListRow } from "./AdminList";
import AdminPagination from "./AdminPagination";
import { CardHeader, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";
import BanReportedSocietyModal from "./BanReportedSocietyModal";

function BanDismissButtons({ busy, onBan, onDismiss }) {
  return <><button className={styles.banBtn} disabled={busy} onClick={onBan}>Ban</button><button className={styles.dismissBtn} disabled={busy} onClick={onDismiss}>Dismiss</button></>;
}

export function removeReportsBySociety(reports, reportId) {
  const target = reports.find((report) => report.id === reportId);
  return target ? reports.filter((report) => report.society_id !== target.society_id) : reports.filter((report) => report.id !== reportId);
}

function getReportMeta(report) {
  return <>Reported by <strong>@{report.reporter_username}</strong>{report.reason ? ` · "${report.reason}"` : ""}</>;
}

function ReportRow({ busy, onBan, onDismiss, report }) {
  const handleBan = (event) => { event.stopPropagation(); onBan(report); };
  const handleDismiss = (event) => { event.stopPropagation(); onDismiss(report.id); };
  return (
    <ListRow onClick={() => navigateToSociety(report.society_id)} style={{ cursor: "pointer" }}>
      <ListInfo name={report.society_name} meta={getReportMeta(report)} />
      <ListActions><BanDismissButtons busy={busy === report.id} onBan={handleBan} onDismiss={handleDismiss} /></ListActions>
    </ListRow>
  );
}

function ReportedSocietiesContent({ busy, onBan, onDismiss, pagination }) {
  return (
    <>
      <AdminPagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} />
      <AnimatedList items={pagination.pageItems} renderItem={(report) => <ReportRow key={report.id} report={report} busy={busy} onBan={onBan} onDismiss={onDismiss} />} />
    </>
  );
}

export default function ReportedSocietiesTab() {
  const [banTarget, setBanTarget] = useState(null);
  const { error, items, loading, setError, setItems } = useAsyncList(fetchReportedSocieties, "Failed to load reports.");
  const { busy, run } = useAsyncAction(setError);
  const pagination = usePaginatedItems(items, ADMIN_LIST_PAGE_SIZE);
  const handleDismiss = (id) => run(id, () => dismissReport(id), () => setItems((current) => current.filter((report) => report.id !== id)), "Failed to dismiss report.");
  const handleBanOpen = (report) => setBanTarget(report);
  const handleBanCancel = () => setBanTarget(null);
  const handleBanConfirm = (reason) => {
    run(
      banTarget.id,
      () => banReportedSociety(banTarget.id, reason),
      () => {
        setItems((current) => removeReportsBySociety(current, banTarget.id));
        setBanTarget(null);
      },
      "Failed to ban society.",
    );
  };
  return (
    <>
      <SectionCard>
        <CardHeader title="Reported Societies" count={items.length} />
        <ErrorMessage message={error} />
        {loading ? <LoadingSpinner /> : items.length ? <ReportedSocietiesContent busy={busy} onBan={handleBanOpen} onDismiss={handleDismiss} pagination={pagination} /> : <SearchEmptyState title="No reported societies" hint="Society reports from users will appear here." />}
      </SectionCard>
      {banTarget ? <BanReportedSocietyModal report={banTarget} busy={busy === banTarget.id} onConfirm={handleBanConfirm} onCancel={handleBanCancel} /> : null}
    </>
  );
}
