/**
 * Shared attendance widget primitives.
 */

import SegmentDetailPanel from "../../../../attendance/components/SegmentDetailPanel";
import { PieChart } from "@mui/x-charts/PieChart";
import widgetStyles from "../ProfileWidgets.module.css";
import attendanceStyles from "../ProfileAttendance.module.css";

const styles = { ...widgetStyles, ...attendanceStyles };

const ATT_BTN_STYLE = { pointerEvents: "auto", position: "relative", zIndex: 1 };

function getPieItemLabel(item, dataIndex, data) {
  return item?.label ?? data[dataIndex]?.label;
}

function donutSeries(data, innerRadius, outerRadius, cornerRadius) {
  return [{ data, innerRadius, outerRadius, paddingAngle: 2, cornerRadius }];
}

function DonutChart({ data, width, height, margin, innerRadius, outerRadius, cornerRadius, onSelect }) {
  return (
    <PieChart
      series={donutSeries(data, innerRadius, outerRadius, cornerRadius)}
      hideLegend
      width={width}
      height={height}
      margin={margin}
      slotProps={{ legend: { hidden: true } }}
      sx={{ "& .MuiChartsLegend-label": { fill: "var(--text) !important" } }}
      onItemClick={onSelect ? (_, identifier, item) => onSelect(getPieItemLabel(item, identifier?.dataIndex, data)) : undefined}
    />
  );
}

function CompactLegend({ items, tone = "default" }) {
  return (
    <div className={styles.compactLegendList}>
      {items.map((entry) => (
        <div key={`${entry.label}-${entry.legendLabel ?? entry.value}`} className={styles.compactLegendRow}>
          <span
            className={`${styles.compactLegendLabel} ${tone === "soft" ? styles.compactLegendLabelSoft : ""}`}
          >
            <span className={styles.compactLegendDot} style={{ background: entry.color }} />
            <span>{entry.legendLabel ?? entry.label}</span>
          </span>
        </div>
      ))}
    </div>
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

function handleDonutClick(event) {
  event.stopPropagation();
}

function buildSegmentHandler(chart, onSegmentClick) {
  return (label) => label && onSegmentClick?.({ chart, label });
}

function CompactDonutLayout({ canvasClassName, chart, data, chartProps, legendTone, onSegmentClick }) {
  const onSelect = onSegmentClick ? buildSegmentHandler(chart, onSegmentClick) : undefined;
  return (
    <div className={styles.compactDonutRow}>
      <div className={canvasClassName}><DonutChart data={data} {...chartProps} onSelect={onSelect} /></div>
      <CompactLegend items={data} tone={legendTone} />
    </div>
  );
}

export function CompactOverallDonut({ overallData, onSegmentClick }) {
  if (!overallData.length) return <p className={styles.compactAttendanceEmpty}>No attendance records yet.</p>;
  const chartProps = { width: 240, height: 210, margin: { top: 10, bottom: 10, left: 10, right: 10 }, innerRadius: 38, outerRadius: 84, cornerRadius: 4 };
  return (
    <div className={styles.compactAttendanceDonut} onClick={handleDonutClick}>
      <CompactDonutLayout canvasClassName={styles.compactDonutCanvas} chart="overall" data={overallData} chartProps={chartProps} legendTone="soft" onSegmentClick={onSegmentClick} />
    </div>
  );
}

export function CompactByTypeDonut({ byTypeData, onSegmentClick }) {
  if (!byTypeData.length) return null;
  const chartProps = { width: 244, height: 188, margin: { top: 8, bottom: 4, left: 8, right: 8 }, innerRadius: 34, outerRadius: 76, cornerRadius: 3 };
  return (
    <div className={styles.compactByTypeSection} onClick={handleDonutClick}>
      <div className={styles.compactByTypeTitle}>By Type</div>
      <div className={styles.compactByTypeDonut}>
        <CompactDonutLayout canvasClassName={styles.compactByTypeCanvas} chart="byType" data={byTypeData} chartProps={chartProps} onSegmentClick={onSegmentClick} />
      </div>
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
        onClick={(event) => {
          event.stopPropagation();
          triggerAttendanceNavigation(onNavigate);
        }}
        style={ATT_BTN_STYLE}
      >
        View attendance details
      </button>
    </div>
  );
}

function triggerAttendanceNavigation(onNavigate) {
  if (typeof onNavigate === "function") {
    onNavigate();
    return;
  }

  window.dispatchEvent(new CustomEvent("navigate", { detail: "attendance" }));
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
