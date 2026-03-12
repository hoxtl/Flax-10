import { useState } from "react";
import { useAttendanceStats } from "./hooks/useAttendanceStats";
import { useTimetableEvents } from "./hooks/useTimetableEvents";
import { useAttendanceRecords } from "./hooks/useAttendanceRecords";
import {
  buildOverallChartData,
  buildByTypeChartData,
  withByTypeColors,
  getEventTypeLabel,
} from "./utils/attendanceChartData";
import OverallAttendanceChart from "./components/OverallAttendanceChart";
import ByTypeAttendanceChart from "./components/ByTypeAttendanceChart";
import RecordAttendanceList from "./components/RecordAttendanceList";
import MarkedAttendanceList from "./components/MarkedAttendanceList";
import SegmentDetailPanel from "./components/SegmentDetailPanel";
import styles from "./AttendancePage.module.css";

const TAB_RECORD = "record";
const TAB_MARKED = "marked";

/** Single responsibility: compose attendance stats and charts. */
export default function AttendancePage() {
  const [listTab, setListTab] = useState(TAB_RECORD);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const { stats, loading, error, refetch: refetchStats } = useAttendanceStats();
  const { recordsByEventId, refetch: refetchRecords } = useAttendanceRecords();
  const { events: timetableEvents, loading: eventsLoading } = useTimetableEvents();

  const refetchAll = () => {
    refetchStats();
    refetchRecords();
  };

  const unmarkedEvents = timetableEvents.filter((e) => !recordsByEventId.has(e.id));
  const markedEvents = timetableEvents
    .filter((e) => recordsByEventId.has(e.id))
    .map((e) => ({ ...e, attended: recordsByEventId.get(e.id) }));

  const attendedEvents = markedEvents.filter((e) => e.attended);
  const missedEvents = markedEvents.filter((e) => !e.attended);

  function getEventsForSegment(segment) {
    if (!segment) return [];
    if (segment.chart === "overall") {
      return segment.label === "Attended" ? attendedEvents : missedEvents;
    }
    if (segment.chart === "byType") {
      return markedEvents.filter((e) => getEventTypeLabel(e) === segment.label);
    }
    return [];
  }

  const detailPanelEvents = getEventsForSegment(selectedSegment);
  const detailPanelLabel = selectedSegment
    ? `${selectedSegment.chart === "overall" ? "Overall" : "By type"}: ${selectedSegment.label}`
    : null;

  if (loading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Attendance</h1>
        <p className={styles.subtitle}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Attendance</h1>
        <p className={styles.subtitle}>Track your attendance for lectures, small groups, and labs.</p>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  const overall = stats?.overall ?? { attended: 0, missed: 0 };
  const by_type = stats?.by_type ?? {};
  const overallData = buildOverallChartData(overall);
  const byTypeEntries = buildByTypeChartData(by_type);
  const byTypeData = withByTypeColors(byTypeEntries);
  const hasAnyData = (overall.attended + overall.missed) > 0 || byTypeEntries.length > 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Attendance</h1>
      <p className={styles.subtitle}>
        Track your attendance for lectures, small groups, and labs.
      </p>

      {!hasAnyData && (
        <p className={styles.empty}>
          No attendance recorded yet. Use the list below to mark events, or you’ll get a prompt during or after class.
        </p>
      )}

      <div className={styles.chartsRow}>
        <div className={styles.charts}>
          <section className={styles.chartSection}>
            <h2 className={styles.chartTitle}>Overall</h2>
            <OverallAttendanceChart
              data={overallData}
              attended={overall.attended}
              missed={overall.missed}
              onSegmentClick={(chart, label) =>
                setSelectedSegment(label ? { chart, label } : null)
              }
            />
          </section>
          <section className={styles.chartSection}>
            <h2 className={styles.chartTitle}>By type</h2>
            <ByTypeAttendanceChart
              data={byTypeData}
              onSegmentClick={(chart, label) =>
                setSelectedSegment(label ? { chart, label } : null)
              }
            />
          </section>
        </div>
        {selectedSegment && (
          <SegmentDetailPanel
            segmentLabel={detailPanelLabel}
            events={detailPanelEvents}
            onClose={() => setSelectedSegment(null)}
          />
        )}
      </div>

      {!eventsLoading && (
        <div className={styles.listPanel}>
          <div className={styles.attendanceTabs}>
            <button
              type="button"
              className={listTab === TAB_RECORD ? styles.attendanceTabActive : styles.attendanceTab}
              onClick={() => setListTab(TAB_RECORD)}
            >
              Record attendance ({unmarkedEvents.length})
            </button>
            <button
              type="button"
              className={listTab === TAB_MARKED ? styles.attendanceTabActive : styles.attendanceTab}
              onClick={() => setListTab(TAB_MARKED)}
            >
              Marked attendance ({markedEvents.length})
            </button>
          </div>
          {listTab === TAB_RECORD && (
            <RecordAttendanceList
              events={unmarkedEvents}
              onRecorded={refetchAll}
            />
          )}
          {listTab === TAB_MARKED && (
            <MarkedAttendanceList
              markedEvents={markedEvents}
              onRecorded={refetchAll}
            />
          )}
        </div>
      )}
    </div>
  );
}
