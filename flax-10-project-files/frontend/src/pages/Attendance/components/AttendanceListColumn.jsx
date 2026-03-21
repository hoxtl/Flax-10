/*
 * Attendance list column.
 */

<<<<<<< HEAD
import { Tabs } from "../../../components/common";
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import MarkedAttendanceList from "./MarkedAttendanceList";
import RecordAttendanceList from "./RecordAttendanceList";
import SegmentDetailPanel from "./SegmentDetailPanel";
import styles from "../AttendancePage.module.css";
import listStyles from "./AttendanceList.module.css";

export default function AttendanceListColumn({ model }) {
  if (model.eventsLoading) return null;
  if (model.selectedSegment) return <AttendanceSegmentPanel model={model} />;
  return <AttendanceTabbedList model={model} />;
}

function AttendanceSegmentPanel({ model }) {
  return (
    <div className={styles.listCol}>
      <SegmentDetailPanel segmentLabel={model.segmentLabel} events={model.segmentEvents} onToggleStatus={model.handleToggleStatus} onClose={model.clearSegment} />
    </div>
  );
}

function AttendanceTabbedList({ model }) {
<<<<<<< HEAD
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
          />
        </div>
=======
  return (
    <div className={styles.listCol}>
      <div className={styles.listPanel}>
        <AttendanceTabs model={model} />
        <AttendanceListContent model={model} />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      </div>
    </div>
  );
}

<<<<<<< HEAD
=======
import { TabBar } from "../../../components/common";

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
const TABS = [
  { id: "record", label: "Record attendance" },
  { id: "marked", label: "Marked" }
];

<<<<<<< HEAD
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
=======
function AttendanceTabs({ model }) {
  const tabs = TABS.map(t => ({
    ...t,
    label: (
      <div className={styles.tabLabelWithBadge}>
        {t.label}
        {t.id === "record" && model.unmarkedEvents.length > 0 && <span className={styles.tabBadge}>{model.unmarkedEvents.length}</span>}
        {t.id === "marked" && model.markedEvents.length > 0 && <span className={styles.tabBadge}>{model.markedEvents.length}</span>}
      </div>
    )
  }));

  return <TabBar tabs={tabs} activeTab={model.listTab} onTabChange={(id) => id === "record" ? model.showRecordTab() : model.showMarkedTab()} layoutId="attendance-tab-underline" />;
}

function AttendanceListContent({ model }) {
  if (model.listTab === "record") return <RecordTabContent model={model} />;
  return <MarkedTabContent model={model} />;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function RecordTabContent({ model }) {
  if (model.unmarkedEvents.length === 0) return <AttendanceEmptyPanel message="All caught up - no unrecorded events." />;
  return <RecordAttendanceList events={model.unmarkedEvents} onRecorded={model.refetchAll} />;
}

function MarkedTabContent({ model }) {
  if (model.markedEvents.length === 0) return <AttendanceEmptyPanel message="No marked events yet." />;
  return <MarkedAttendanceList markedEvents={model.markedEvents} onRecorded={model.refetchAll} />;
}

function AttendanceEmptyPanel({ message }) {
  return (
    <div className={listStyles.recordSection}>
      <p className={listStyles.recordHint}>{message}</p>
    </div>
  );
}
