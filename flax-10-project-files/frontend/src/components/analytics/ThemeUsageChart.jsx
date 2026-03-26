/*
 * Theme usage analytics chart.
 */

import { PieChart } from "@mui/x-charts/PieChart";

import EmptyState from "../common/empty_state/EmptyState";
import chartStyles from "./Charts.module.css";

import ThemeUsageHeader from "./ThemeUsageHeader";
import ThemeUsageLegend from "./ThemeUsageLegend";
import { getBadge, getPieSeries } from "./themeUsageChartData";

function ThemeUsageBody({ summary }) {
  return <>
    <div className={chartStyles.chartCenter}>
      <PieChart series={getPieSeries(summary)} height={220} sx={{ "& .MuiChartsLegend-root": { display: "none" } }} />
    </div>
    <ThemeUsageLegend summary={summary} />
  </>;
}

export default function ThemeUsageChart({ themeStats }) {
  const { summary } = themeStats;
  const darkPct = summary.dark_percentage ?? 0;
  return <div><ThemeUsageHeader badge={getBadge(darkPct)} peakDarkHour={summary.peak_dark_hour} />{summary.total_minutes === 0 ? <EmptyState icon="🌓" title="No theme session data yet" description="Keep using the app and your light/dark usage will appear here." /> : <ThemeUsageBody summary={summary} />}</div>;
}
