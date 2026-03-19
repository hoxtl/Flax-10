/*
 * Attendance list column.
 */

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
  return (
    <div className={styles.listCol}>
      <div className={styles.listPanel}>
        <AttendanceTabs model={model} />
        <AttendanceListContent model={model} />
      </div>
    </div>
  );
}

function AttendanceTabs({ model }) {
  return (
    <div className={styles.attendanceTabs}>
      <AttendanceTabButton active={model.listTab === "record"} badge={model.unmarkedEvents.length} onClick={model.showRecordTab}>Record attendance</AttendanceTabButton>
      <AttendanceTabButton active={model.listTab === "marked"} badge={model.markedEvents.length} onClick={model.showMarkedTab}>Marked</AttendanceTabButton>
    </div>
  );
}

function AttendanceTabButton({ active, badge, onClick, children }) {
  const className = active ? styles.attendanceTabActive : styles.attendanceTab;

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
      {badge > 0 && <span className={styles.tabBadge}>{badge}</span>}
    </button>
  );
}

function AttendanceListContent({ model }) {
  if (model.listTab === "record") return <RecordTabContent model={model} />;
  return <MarkedTabContent model={model} />;
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
