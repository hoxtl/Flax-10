<<<<<<< HEAD
/*
 * Reported societies admin tab.
 */

import { banReportedSociety, dismissReport, fetchReportedSocieties } from "../../../api/adminApi";
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import styles from "../styles";
import { ADMIN_LIST_PAGE_SIZE } from "../constants";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAsyncList } from "../hooks/useAsyncList";
import { usePaginatedItems } from "../hooks/usePaginatedItems";
import { navigateToSociety } from "../utils/adminNavigation";
import { AnimatedList, ListActions, ListInfo, ListRow } from "./AdminList";
import AdminPagination from "./AdminPagination";
import { CardHeader, ErrorMessage, LoadingSpinner, SectionCard } from "./AdminSurface";

function BanDismissButtons({ busy, onBan, onDismiss }) {
  return <><button className={styles.banBtn} disabled={busy} onClick={onBan}>Ban</button><button className={styles.dismissBtn} disabled={busy} onClick={onDismiss}>Dismiss</button></>;
}

function removeReportsBySociety(reports, reportId) {
  const target = reports.find((report) => report.id === reportId);
  return target ? reports.filter((report) => report.society_id !== target.society_id) : reports.filter((report) => report.id !== reportId);
}

function getReportMeta(report) {
  return <>Reported by <strong>@{report.reporter_username}</strong>{report.reason ? ` · "${report.reason}"` : ""}</>;
}

function ReportRow({ busy, onBan, onDismiss, report }) {
  const stopAndRun = (event, action) => { event.stopPropagation(); action(report.id); };
  return (
    <ListRow onClick={() => navigateToSociety(report.society_id)} style={{ cursor: "pointer" }}>
      <ListInfo name={report.society_name} meta={getReportMeta(report)} />
      <ListActions><BanDismissButtons busy={busy === report.id} onBan={(event) => stopAndRun(event, onBan)} onDismiss={(event) => stopAndRun(event, onDismiss)} /></ListActions>
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
  const { error, items, loading, setError, setItems } = useAsyncList(fetchReportedSocieties, "Failed to load reports.");
  const { busy, run } = useAsyncAction(setError);
  const pagination = usePaginatedItems(items, ADMIN_LIST_PAGE_SIZE);
  const handleDismiss = (id) => run(id, () => dismissReport(id), () => setItems((current) => current.filter((report) => report.id !== id)), "Failed to dismiss report.");
  const handleBan = (id) => { const reason = window.prompt("Optional reason to send to the society creator:", ""); if (reason === null) return; run(id, () => banReportedSociety(id, reason), () => setItems((current) => removeReportsBySociety(current, id)), "Failed to ban society."); };
  return (
    <SectionCard>
      <CardHeader title="Reported Societies" count={items.length} />
      <ErrorMessage message={error} />
      {loading ? <LoadingSpinner /> : items.length ? <ReportedSocietiesContent busy={busy} onBan={handleBan} onDismiss={handleDismiss} pagination={pagination} /> : <SearchEmptyState title="No reported societies" hint="Society reports from users will appear here." />}
    </SectionCard>
=======
/** Admin tab for managing reported societies. */
import { motion } from "framer-motion";
import { Pagination } from "../../../components/Pagination/Pagination";
import { fetchReportedSocieties, dismissReport, banReportedSociety } from "../../../api/adminApi";
import { useAsyncList, usePaginatedItems, useAsyncAction, stagger, rowAnim } from "../hooks/useAdminData";
import { AdminListSection, AnimatedList, ListInfo, ListActions, BanDismissButtons } from "./AdminUI";
import styles from "../AdminPage.module.css";

function navigateToSociety(societyId) {
  window.dispatchEvent(new CustomEvent("navigate", { detail: `societies_${societyId}` }));
}

function ReportRow({ report, busy, onBan, onDismiss }) {
  const handleClick = () => navigateToSociety(report.society_id);
  const meta = <>Reported by <strong>@{report.reporter_username}</strong>{report.reason ? ` · "${report.reason}"` : ""}</>;
  const stopAnd = (e, fn) => { e.stopPropagation(); fn(report.id); };
  return (
    <motion.div className={styles.listRow} variants={rowAnim} layout onClick={handleClick} style={{ cursor: "pointer" }}>
      <ListInfo name={report.society_name} meta={meta} />
      <ListActions><BanDismissButtons busy={busy === report.id} onBan={(e) => stopAnd(e, onBan)} onDismiss={(e) => stopAnd(e, onDismiss)} /></ListActions>
    </motion.div>
  );
}

function removeReportsBySociety(reports, reportId) {
  const target = reports.find((r) => r.id === reportId);
  return target ? reports.filter((r) => r.society_id !== target.society_id) : reports.filter((r) => r.id !== reportId);
}

export default function ReportedSocietiesTab() {
  const { items: reports, setItems: setReports, loading, error, setError } = useAsyncList(fetchReportedSocieties);
  const { currentPage, setCurrentPage, totalPages, pageItems } = usePaginatedItems(reports);
  const { busy, execute } = useAsyncAction(setError);
  const handleDismiss = (id) => execute(id, () => dismissReport(id), () => setReports((p) => p.filter((r) => r.id !== id)));
  const handleBan = (id) => {
    const reason = window.prompt("Optional reason to send to the society creator:", "");
    if (reason === null) return;
    execute(id, () => banReportedSociety(id, reason), () => setReports((p) => removeReportsBySociety(p, id)));
  };
  const pagination = <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />;
  const renderRow = (r) => <ReportRow key={r.id} report={r} busy={busy} onBan={handleBan} onDismiss={handleDismiss} />;
  return (
    <AdminListSection title="Reported Societies" count={reports.length} error={error} loading={loading} isEmpty={reports.length === 0} emptyMessage="No reported societies — all clear! 🎉" pagination={pagination}>
      <AnimatedList items={pageItems} renderItem={renderRow} stagger={stagger} />
    </AdminListSection>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  );
}
