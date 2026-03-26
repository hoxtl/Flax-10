/*
 * Theme usage analytics chart.
 */

<<<<<<< HEAD
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
=======
const formatPercentage = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0%';
  const rounded = Math.round(num * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
};

const PIE_SERIES = (summary) => {
  const darkPct = summary.dark_percentage ?? 0;
  const lightPct = summary.light_percentage ?? 0;
  return [{
    data: [
      { id: 0, value: summary.light_minutes, label: `Light Mode ${formatPercentage(lightPct)}`, color: '#FFD54F' },
      { id: 1, value: summary.dark_minutes, label: `Dark Mode ${formatPercentage(darkPct)}`, color: '#5C6BC0' },
    ],
    innerRadius: 50,
    outerRadius: 100,
    paddingAngle: 3,
    cornerRadius: 4
  }];
};

const getBadge = (darkPct) => {
  if (darkPct >= 60) return '🦉 Night Owl';
  if (darkPct >= 30) return '🌗 Mixed';
  return '☀️ Day Worker';
};

const ChartHeader = ({ badge, peakDarkHour }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
    <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>{badge}</span>
    {peakDarkHour && (
      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Peak dark mode: {peakDarkHour}</span>
    )}
  </div>
);

const ThemeUsageChart = ({ themeStats }) => {
  const { summary } = themeStats;
  const darkPct = summary.dark_percentage ?? 0;
  return (
    <div>
      <ChartHeader badge={getBadge(darkPct)} peakDarkHour={summary.peak_dark_hour} />
      {summary.total_minutes === 0
        ? <EmptyState icon="🌓" title="No theme session data yet" description="Keep using the app and your light/dark usage will appear here." />
        : <PieChart series={PIE_SERIES(summary)} height={220} sx={{ '& .MuiChartsLegend-label': { fill: 'var(--text) !important' } }} />
      }
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </div>
    <ThemeUsageLegend summary={summary} />
  </>;
}

export default function ThemeUsageChart({ themeStats }) {
  const { summary } = themeStats;
  const darkPct = summary.dark_percentage ?? 0;
  return <div><ThemeUsageHeader badge={getBadge(darkPct)} peakDarkHour={summary.peak_dark_hour} />{summary.total_minutes === 0 ? <EmptyState icon="🌓" title="No theme session data yet" description="Keep using the app and your light/dark usage will appear here." /> : <ThemeUsageBody summary={summary} />}</div>;
}
