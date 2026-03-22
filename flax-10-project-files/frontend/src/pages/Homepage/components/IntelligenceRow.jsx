/**
 * Homepage intelligence row.
 */

import { ConfirmModal } from "../../../components/common";
import { useAuth } from "../../../context/AuthContext";
import styles from "./IntelligenceRow.module.css";
import IntelligenceGrid from "./IntelligenceGrid";
import { renderIntelligenceWidget } from "./IntelligenceWidgetRenderer";
import { CATALOGUE, getSemesterProgress, useIntelligenceDashboard } from "../hooks/useIntelligenceDashboard";

export default function IntelligenceRow(props) {
  const auth = useAuth();
  const dashboard = useIntelligenceDashboard({ ...props, ...auth });
  return (
    <section className={styles.section}>
      <IntelligenceGrid {...getGridProps(props, dashboard)} />
      <ResetModal dashboard={dashboard} />
    </section>
  );
}

function getGridProps(props, dashboard) {
  return {
    catalogue: CATALOGUE,
    edit: dashboard.edit,
    layout: dashboard.layout,
    onRandomize: dashboard.handleRandomize,
    onReset: dashboard.handleReset,
    setEdit: dashboard.setEdit,
    setLayout: dashboard.setLayout,
    setShowAdd: dashboard.setShowAdd,
    setWidgetSize: dashboard.setWidgetSize,
    showAdd: dashboard.showAdd,
    widgetRenderer: (id, size) => renderIntelligenceWidget(id, { ...props, dashboard }, size),
    widgetSizes: dashboard.widgetSizes,
  };
}

function ResetModal({ dashboard }) {
  if (!dashboard.showResetConfirm) return null;
  return <ConfirmModal title="Reset Layout" message="This will restore the default widget layout. Any customisation will be lost." confirmText="Reset" cancelText="Cancel" isDanger onConfirm={() => confirmReset(dashboard)} onCancel={() => dashboard.setShowResetConfirm(false)} />;
}

function confirmReset(dashboard) {
  dashboard.setLayout(["hero", "deadlines", "todayTasks", "bigTimeline"]);
  dashboard.setShowResetConfirm(false);
}

export function SemesterProgressWidget() {
  const progress = getSemesterProgress();
  if (!progress) return null;
  return <SemesterProgressCard label={getSemesterLabel(progress)} pct={progress.pct} />;
}

function SemesterProgressCard({ label, pct }) {
  return (
    <div className={styles.semesterWidget}>
      <div className={styles.semesterWidgetHead}><span className={styles.semesterWidgetLabel}>Semester progress</span><span className={styles.semesterWidgetValue}>{pct}%</span></div>
      <div className={styles.semesterWidgetTrack} aria-hidden="true"><div className={styles.semesterWidgetFill} style={{ width: `${pct}%` }} /></div>
      <span className={styles.semesterWidgetMeta}>{label}</span>
    </div>
  );
}

function getSemesterLabel(progress) {
  if (progress.isFinished) return "Semester completed";
  if (progress.hasStarted) return `${progress.pct}% through term`;
  return "Semester not started";
}
