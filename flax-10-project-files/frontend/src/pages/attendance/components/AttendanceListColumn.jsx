/*
 * Attendance list column.
 */

import SkeletonBlock from "../../../components/common/loading_state/SkeletonBlock";
import { Tabs } from "../../../components/common";
import { useToast } from "../../../context/ToastContext";
import MarkedAttendanceList from "./MarkedAttendanceList";
import RecordAttendanceList from "./RecordAttendanceList";
import SegmentDetailPanel from "./SegmentDetailPanel";
import AttendanceListSection from "./AttendanceListSection";
import styles from "../AttendancePage.module.css";
import listStyles from "./AttendanceList.module.css";

export default function AttendanceListColumn({ model }) {
  if (model.selectedSegment) return <AttendanceSegmentPanel model={model} />;
  return <AttendanceTabbedList model={model} />;
}

function AttendanceSegmentPanel({ model }) {
  const showToast = useToast();
  const handleToggleStatus = createStatusToggleHandler(model.handleToggleStatus, showToast);
  return (
    <div className={styles.listCol}>
      <SegmentDetailPanel segmentLabel={model.segmentLabel} events={model.segmentEvents} onToggleStatus={handleToggleStatus} onClose={model.clearSegment} />
    </div>
  );
}

function AttendanceTabbedList({ model }) {
  const tabs = buildAttendanceTabs(model);
  return (
    <div className={styles.listCol}>
      <div className={styles.listPanel}>
        <div className={styles.attendanceTabsWrap}>
          <Tabs
            tabs={tabs}
            activeTab={model.listTab}
            onTabChange={(id) => id === "record" ? model.showRecordTab() : model.showMarkedTab()}
            layoutId="attendanceTabIndicator"
            tabVariant="heading"
            className={styles.attendanceTabs}
            disableContentAnimation
            />
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "record", label: "Record attendance" },
  { id: "marked", label: "Marked" }
];

function buildAttendanceTabs(model) {
  return TABS.map((tab) => ({
    ...tab,
    label: (
      <span className={styles.tabLabelWithBadge}>
        <span>{tab.label}</span>
        {tab.id === "record" && model.unmarkedEvents.length > 0 && <span className={styles.tabBadge}>{model.unmarkedEvents.length}</span>}
        {tab.id === "marked" && model.markedEvents.length > 0 && <span className={styles.tabBadge}>{model.markedEvents.length}</span>}
      </span>
    ),
    content: tab.id === "record" ? <RecordTabContent model={model} /> : <MarkedTabContent model={model} />
  }));
}

function RecordTabContent({ model }) {
  if (model.eventsLoading) return <AttendanceLoadingPanel />;
  if (model.unmarkedEvents.length === 0) return <AttendanceEmptyPanel message="All caught up" hint="No events left to record — you're on top of it." />;
  return <RecordAttendanceList events={model.unmarkedEvents} onRecorded={model.refetchAll} />;
}

function MarkedTabContent({ model }) {
  if (model.eventsLoading) return <AttendanceLoadingPanel />;
  if (model.markedEvents.length === 0) return <AttendanceEmptyPanel message="No marked events yet" hint="Events you've recorded will appear here." />;
  return <MarkedAttendanceList markedEvents={model.markedEvents} onRecorded={model.refetchAll} />;
}

function AttendanceLoadingPanel() {
  return (
    <AttendanceListSection hint="Loading attendance events...">
      <div className={styles.listLoadingRows} aria-label="Loading attendance events">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className={styles.listLoadingRow}>
            <div className={styles.listLoadingInfo}>
              <SkeletonBlock className={styles.listLoadingTitle} />
              <SkeletonBlock className={styles.listLoadingMeta} />
            </div>
            <div className={styles.listLoadingActions}>
              <SkeletonBlock className={styles.listLoadingAction} />
              <SkeletonBlock className={styles.listLoadingAction} />
            </div>
          </div>
        ))}
      </div>
    </AttendanceListSection>
  );
}

function AttendanceEmptyPanel({ message, hint }) {
  return (
    <div className={listStyles.emptyStateWrap}>
      <span className={listStyles.emptyStateIcon} aria-hidden="true">✓</span>
      <p className={listStyles.emptyStateTitle}>{message}</p>
      {hint && <p className={listStyles.emptyStateHint}>{hint}</p>}
    </div>
  );
}

function createStatusToggleHandler(toggleStatus, showToast) {
  return async (eventId, attended) => {
    try {
      await toggleStatus(eventId, attended);
      showToast?.(buildAttendanceMarkedMessage(attended));
    } catch {
      showToast?.("Couldn't mark attendance. Try again.", { variant: "error" });
    }
  };
}

function buildAttendanceMarkedMessage(attended) {
  return attended ? "Attendance marked." : "Attendance marked as missed.";
}
