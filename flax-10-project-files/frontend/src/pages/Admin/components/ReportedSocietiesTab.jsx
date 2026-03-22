/*
 * Reported societies admin tab.
 */

import { banReportedSociety, dismissReport, fetchReportedSocieties } from "../../../api/adminApi";
import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";
import styles from "../AdminPage.module.css";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useAsyncList } from "../hooks/useAsyncList";
import { navigateToSociety } from "../utils/adminNavigation";
import { AnimatedList, ListActions, ListInfo, ListRow } from "./AdminList";
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

function ReportedSocietiesContent({ busy, items, onBan, onDismiss }) {
  return <AnimatedList items={items} renderItem={(report) => <ReportRow key={report.id} report={report} busy={busy} onBan={onBan} onDismiss={onDismiss} />} />;
}

export default function ReportedSocietiesTab() {
  const { error, items, loading, setError, setItems } = useAsyncList(fetchReportedSocieties, "Failed to load reports.");
  const { busy, run } = useAsyncAction(setError);
  const handleDismiss = (id) => run(id, () => dismissReport(id), () => setItems((current) => current.filter((report) => report.id !== id)), "Failed to dismiss report.");
  const handleBan = (id) => { const reason = window.prompt("Optional reason to send to the society creator:", ""); if (reason === null) return; run(id, () => banReportedSociety(id, reason), () => setItems((current) => removeReportsBySociety(current, id)), "Failed to ban society."); };
  return (
    <SectionCard>
      <CardHeader title="Reported Societies" count={items.length} />
      <ErrorMessage message={error} />
      {loading ? <LoadingSpinner /> : items.length ? <ReportedSocietiesContent items={items} busy={busy} onBan={handleBan} onDismiss={handleDismiss} /> : <SearchEmptyState title="No reported societies" hint="Society reports from users will appear here." />}
    </SectionCard>
  );
}
