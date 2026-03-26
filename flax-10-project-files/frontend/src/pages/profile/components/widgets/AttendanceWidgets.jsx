import { useState } from "react";
<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Profile/components/widgets/AttendanceWidgets.jsx
<<<<<<< HEAD
import Card from "../../../../components/common/card/Card";
=======
import Card from "../../../../components/common/Card/Card";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
=======
import Card from "../../../../components/common/Card/Card";
>>>>>>> main:flax-10-project-files/frontend/src/pages/profile/components/widgets/AttendanceWidgets.jsx
import ProfileWidget from "./ProfileWidget";
import AttendanceCharts from "./attendance/AttendanceCharts";
import {
  AttendanceWarningBadge,
  CompactAttHeader,
  CompactByTypeDonut,
  CompactOverallDonut,
  SegmentDetailPanelWrapper,
} from "./attendance/AttendanceShared";
import { useAttendanceWidgetData } from "./attendance/useAttendanceWidgetData";
import widgetStyles from "./ProfileWidgets.module.css";
import attendanceStyles from "./ProfileAttendance.module.css";

const styles = { ...widgetStyles, ...attendanceStyles };

function useSegmentState() {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const closeSegment = () => setSelectedSegment(null);
  return { selectedSegment, setSelectedSegment, closeSegment };
}

function AttendanceDetails({ selectedSegment, segmentEvents, handleToggleStatus, onClose }) {
  return (
    <SegmentDetailPanelWrapper
      selectedSegment={selectedSegment}
      events={segmentEvents}
      onToggleStatus={handleToggleStatus}
      onClose={onClose}
    />
  );
}

export function CompactAttendanceTile({ onNavigate }) {
  const { selectedSegment, setSelectedSegment, closeSegment } = useSegmentState();
  const data = useAttendanceWidgetData(selectedSegment);
  if (data.loading || data.error || !data.stats) return null;
  return (
    <Card className={`${styles.glassCard} ${styles.compactAttCard}`} variant="glass">
      {data.attendancePct < 50 && <AttendanceWarningBadge attendancePct={data.attendancePct} />}
<<<<<<< HEAD
      <CompactAttHeader onNavigate={() => onNavigate?.("attendance")} />
=======
      <CompactAttHeader onNavigate={() => onNavigate?.("analytics")} />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      <CompactOverallDonut overallData={data.overallData} onSegmentClick={setSelectedSegment} />
      <CompactByTypeDonut byTypeData={data.byTypeData} onSegmentClick={setSelectedSegment} />
      <AttendanceDetails
        selectedSegment={selectedSegment}
        segmentEvents={data.segmentEvents}
        handleToggleStatus={data.handleToggleStatus}
        onClose={closeSegment}
      />
    </Card>
  );
}

export function CompactStreakTile({ streaks }) {
  return (
    <Card className={`${styles.glassCard} ${styles.compactTile}`} variant="glass">
      <div className={styles.cardLabel}>STREAK</div>
      <div className={styles.compactStreakBody}>
        <div className={styles.compactStreakItem}>
          <span className={styles.compactStreakNum}>{streaks?.current ?? "—"}</span>
          <span className={styles.compactStreakMeta}>🔥 current</span>
        </div>
        <div className={styles.compactStreakItem}>
          <span className={styles.compactStreakNum}>{streaks?.longest ?? "—"}</span>
          <span className={styles.compactStreakMeta}>🏆 best</span>
        </div>
      </div>
    </Card>
  );
}

function AttendanceLoading() {
  return <div className={styles.attendanceLoading}>Loading metrics...</div>;
}

function buildAttendanceLabel(attendancePct) {
  return attendancePct < 50 ? <AttendanceWarningBadge attendancePct={attendancePct} /> : null;
}

function buildSegmentClick(setSelectedSegment) {
  return (chart, label) => setSelectedSegment(label ? { chart, label } : null);
}

function AttendanceWidgetBody({ data, selectedSegment, setSelectedSegment, closeSegment }) {
  return (
    <>
      <AttendanceCharts
        overall={data.overall}
        overallData={data.overallData}
        byTypeData={data.byTypeData}
        onSegmentClick={buildSegmentClick(setSelectedSegment)}
      />
      <AttendanceDetails
        selectedSegment={selectedSegment}
        segmentEvents={data.segmentEvents}
        handleToggleStatus={data.handleToggleStatus}
        onClose={closeSegment}
      />
    </>
  );
}

export function AttendanceWidget() {
  const { selectedSegment, setSelectedSegment, closeSegment } = useSegmentState();
  const data = useAttendanceWidgetData(selectedSegment);
  if (data.loading) return <ProfileWidget title="ATTENDANCE"><AttendanceLoading /></ProfileWidget>;
  if (data.error || !data.stats) return null;
  return (
    <ProfileWidget
      title="ATTENDANCE"
      subtitle={buildAttendanceLabel(data.attendancePct)}
      className={`${styles.attendanceWidget} ${styles.attendanceWidgetDetailed}`}
    >
      <AttendanceWidgetBody data={data} selectedSegment={selectedSegment} setSelectedSegment={setSelectedSegment} closeSegment={closeSegment} />
    </ProfileWidget>
  );
}
