/** Admin tab for managing reported societies. */
import { motion } from "framer-motion";
import { Pagination } from "../../../components/Pagination/Pagination";
import { fetchReportedSocieties, dismissReport, banReportedSociety } from "../../../api/admin/adminApi";
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
  );
}
