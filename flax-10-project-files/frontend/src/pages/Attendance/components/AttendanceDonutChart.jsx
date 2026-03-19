/*
 * Shared attendance donut chart.
 */

import { PieChart } from "@mui/x-charts/PieChart";
import { buildDonutSeries, buildPieClickHandler } from "../utils/attendanceChartUtils";

const chartMargin = { top: 10, bottom: 10, left: 10, right: 10 };
const chartSx = { "& .MuiChartsLegend-label": { fill: "var(--text) !important" } };

export default function AttendanceDonutChart({ chart, data, onSegmentClick, valueFormatter }) {
  return <PieChart series={buildDonutSeries(data, valueFormatter)} height={220} margin={chartMargin} slotProps={{ legend: { hidden: true } }} sx={chartSx} onItemClick={buildPieClickHandler(onSegmentClick, chart, data)} />;
}
