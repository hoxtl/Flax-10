import SegmentDetailPanel from "../../../../Attendance/components/SegmentDetailPanel";
import { PieChart } from "@mui/x-charts/PieChart";
import widgetStyles from "../ProfileWidgets.module.css";
import attendanceStyles from "../ProfileAttendance.module.css";

const styles = { ...widgetStyles, ...attendanceStyles };

function getPieItemLabel(item, dataIndex, data) {
  return item?.label ?? data[dataIndex]?.label;
}

function donutSeries(data, innerRadius, outerRadius, cornerRadius) {
  return [{ data, innerRadius, outerRadius, paddingAngle: 2, cornerRadius }];
}

function DonutChart({ data, height, margin, innerRadius, outerRadius, cornerRadius, onSelect }) {
  return (
    <PieChart
      series={donutSeries(data, innerRadius, outerRadius, cornerRadius)}
      height={height}
      margin={margin}
      slotProps={{ legend: { hidden: true } }}
      sx={{ "& .MuiChartsLegend-label": { fill: "var(--text) !important" } }}
      onItemClick={(_, identifier, item) => onSelect(getPieItemLabel(item, identifier?.dataIndex, data))}
    />
  );
}

export function AttendanceWarningBadge({ attendancePct }) {
  return (
    <div className={styles.attendanceWarning}>
      <span className={styles.warningIcon}>⚡</span>
      <span>Low Attendance ({attendancePct}%)</span>
    </div>
  );
}

export function CompactOverallDonut({ overallData, onSegmentClick }) {
  if (!overallData.length) return <p className={styles.compactAttendanceEmpty}>No attendance records yet.</p>;
  return (
    <div className={styles.compactAttendanceDonut} onClick={(event) => event.stopPropagation()}>
      <DonutChart
        data={overallData}
        height={210}
        margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
        innerRadius={38}
        outerRadius={84}
        cornerRadius={4}
        onSelect={(label) => label && onSegmentClick({ chart: "overall", label })}
      />
    </div>
  );
}

function ByTypeLegend({ byTypeData }) {
  return (
    <div className={styles.compactByTypeLegend}>
      {byTypeData.map((entry) => (
        <div key={entry.label} className={styles.compactByTypeRow}>
          <span className={styles.compactByTypeLabel}>
            <span className={styles.compactByTypeDot} style={{ background: entry.color }} />
            <span>{entry.label}</span>
          </span>
          <span className={styles.compactByTypeCount}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function CompactByTypeDonut({ byTypeData, onSegmentClick }) {
  if (!byTypeData.length) return null;
  return (
    <div className={styles.compactByTypeSection} onClick={(event) => event.stopPropagation()}>
      <div className={styles.compactByTypeTitle}>By Type</div>
      <div className={styles.compactByTypeDonut}>
        <DonutChart
          data={byTypeData}
          height={132}
          margin={{ top: 8, bottom: 4, left: 8, right: 8 }}
          innerRadius={24}
          outerRadius={54}
          cornerRadius={3}
          onSelect={(label) => label && onSegmentClick({ chart: "byType", label })}
        />
      </div>
      <ByTypeLegend byTypeData={byTypeData} />
    </div>
  );
}

export function CompactAttHeader({ onNavigate }) {
  return (
    <div className={styles.compactAttHeader}>
      <div className={styles.cardLabel}>MY VENIO ANALYSIS</div>
      <button
        type="button"
        className={`${styles.heatmapLinkBtn} ${styles.compactAttAnalysisBtn}`}
        onClick={onNavigate}
      >
        View full analytics
      </button>
    </div>
  );
}

export function SegmentDetailPanelWrapper({ selectedSegment, events, onToggleStatus, onClose }) {
  if (!selectedSegment) return null;
  const scope = selectedSegment.chart === "overall" ? "Overall" : "By type";
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <SegmentDetailPanel
        segmentLabel={`${scope}: ${selectedSegment.label}`}
        events={events}
        onToggleStatus={onToggleStatus}
        onClose={onClose}
        className={styles.profileAttendanceDetail}
      />
    </div>
  );
}
