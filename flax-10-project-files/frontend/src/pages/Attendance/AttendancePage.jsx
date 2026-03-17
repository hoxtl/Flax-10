import { useState } from "react";
import AppPage from "../../components/common/AppPage/AppPage";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
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
      <AppPage title="Attendance" subtitle="Loading…">
        <div className={styles.loadingContainer}>
          <p>Please wait while we fetch your stats...</p>
        </div>
      </AppPage>
    );
  }

  if (error) {
    return (
      <AppPage title="Attendance" subtitle="Track your attendance for lectures, small groups, and labs.">
        <p className={styles.error}>{error}</p>
      </AppPage>
    );
  }

  const overall = stats?.overall ?? { attended: 0, missed: 0 };
  const by_type = stats?.by_type ?? {};
  const overallData = buildOverallChartData(overall);
  const byTypeEntries = buildByTypeChartData(by_type);
  const byTypeData = withByTypeColors(byTypeEntries);
  const hasAnyData = (overall.attended + overall.missed) > 0 || byTypeEntries.length > 0;

  const tabOptions = [
    { value: TAB_RECORD, label: `Record (${unmarkedEvents.length})` },
    { value: TAB_MARKED, label: `Marked (${markedEvents.length})` },
  ];

  return (
    <AppPage
      title="Attendance"
      subtitle="Track your attendance for lectures, small groups, and labs."
      width="xl"
    >
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
            <SegmentedControl
              options={tabOptions}
              value={listTab}
              onChange={setListTab}
              fill
            />
          </div>
          <div className={styles.listContent}>
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
        </div>
      )}
    </AppPage>
  );
}
