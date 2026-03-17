import { useState, useRef, useEffect } from "react";
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

export default function AttendancePage() {
  const [listTab, setListTab] = useState(TAB_RECORD);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const { stats, loading, error, refetch: refetchStats } = useAttendanceStats();
  const { recordsByEventId, refetch: refetchRecords } = useAttendanceRecords();
  const { events: timetableEvents, loading: eventsLoading } = useTimetableEvents();

  const chartsColRef = useRef(null);
  const [chartsHeight, setChartsHeight] = useState(null);

  useEffect(() => {
    const el = chartsColRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setChartsHeight(entry.contentRect.height);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
  const totalMarked = overall.attended + overall.missed;
  const pct = totalMarked > 0 ? Math.round((overall.attended / totalMarked) * 100) : null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Attendance</h1>
      <p className={styles.subtitle}>Track your attendance for lectures, small groups, and labs.</p>

      {pct !== null && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{pct}%</span>
            <span className={styles.summaryLabel}>Overall</span>
          </div>
          <div className={styles.summarySep} />
          <div className={styles.summaryItem}>
            <span className={`${styles.summaryValue} ${styles.summaryAttended}`}>{overall.attended}</span>
            <span className={styles.summaryLabel}>Attended</span>
          </div>
          <div className={styles.summarySep} />
          <div className={styles.summaryItem}>
            <span className={`${styles.summaryValue} ${styles.summaryMissed}`}>{overall.missed}</span>
            <span className={styles.summaryLabel}>Missed</span>
          </div>
          <div className={styles.summarySep} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{unmarkedEvents.length}</span>
            <span className={styles.summaryLabel}>To record</span>
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* Left: charts */}
        <div className={styles.chartsCol} ref={chartsColRef}>
          {totalMarked === 0 && (
            <p className={styles.empty}>
              No attendance recorded yet. Use the list to mark events, or you'll get a prompt during or after class.
            </p>
          )}
          <div className={styles.chartCard}>
            <p className={styles.chartCardLabel}>Overall</p>
            <OverallAttendanceChart
              data={overallData}
              attended={overall.attended}
              missed={overall.missed}
              onSegmentClick={(chart, label) =>
                setSelectedSegment(label ? { chart, label } : null)
              }
            />
          </div>
          <div className={styles.chartCard}>
            <p className={styles.chartCardLabel}>By type</p>
            <ByTypeAttendanceChart
              data={byTypeData}
              onSegmentClick={(chart, label) =>
                setSelectedSegment(label ? { chart, label } : null)
              }
            />
          </div>
        </div>

        {/* Right: list panel, height-capped to match left column */}
        {!eventsLoading && (
          <div
            className={styles.listCol}
            style={chartsHeight ? { maxHeight: chartsHeight } : undefined}
          >
            {selectedSegment ? (
              <SegmentDetailPanel
                segmentLabel={detailPanelLabel}
                events={detailPanelEvents}
                onClose={() => setSelectedSegment(null)}
              />
            ) : (
              <div className={styles.listPanel}>
                <div className={styles.attendanceTabs}>
                  <button
                    type="button"
                    className={listTab === TAB_RECORD ? styles.attendanceTabActive : styles.attendanceTab}
                    onClick={() => setListTab(TAB_RECORD)}
                  >
                    Record attendance
                    {unmarkedEvents.length > 0 && (
                      <span className={styles.tabBadge}>{unmarkedEvents.length}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={listTab === TAB_MARKED ? styles.attendanceTabActive : styles.attendanceTab}
                    onClick={() => setListTab(TAB_MARKED)}
                  >
                    Marked
                    {markedEvents.length > 0 && (
                      <span className={styles.tabBadge}>{markedEvents.length}</span>
                    )}
                  </button>
                </div>
                {listTab === TAB_RECORD && (
                  <RecordAttendanceList events={unmarkedEvents} onRecorded={refetchAll} />
                )}
                {listTab === TAB_MARKED && (
                  <MarkedAttendanceList markedEvents={markedEvents} onRecorded={refetchAll} />
                )}
                {listTab === TAB_RECORD && unmarkedEvents.length === 0 && (
                  <div className={styles.recordSection}>
                    <p className={styles.recordHint}>All caught up — no unrecorded events.</p>
                  </div>
                )}
                {listTab === TAB_MARKED && markedEvents.length === 0 && (
                  <div className={styles.recordSection}>
                    <p className={styles.recordHint}>No marked events yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
