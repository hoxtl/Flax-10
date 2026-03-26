/*
 * Theme usage chart legend.
 */

import { DARK_COLOR, LIGHT_COLOR, formatPercentage } from "./themeUsageChartData";

const legendStyle = { display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "0.9rem", marginTop: "0.5rem", minWidth: 0 };
const itemStyle = { display: "inline-flex", alignItems: "center", gap: "0.42rem", minWidth: 0, fontSize: "0.78rem", color: "var(--text)", fontWeight: 600 };
const dotStyle = (color) => ({ width: "10px", height: "10px", borderRadius: "999px", background: color, flexShrink: 0 });
const percentStyle = { color: "var(--muted)", fontWeight: 500 };

function LegendItem({ color, label, percentage }) {
  return <div style={itemStyle}><span aria-hidden style={dotStyle(color)} /><span style={{ minWidth: 0 }}>{label}</span><span style={percentStyle}>{percentage}</span></div>;
}

export default function ThemeUsageLegend({ summary }) {
  return <div style={legendStyle}><LegendItem color={LIGHT_COLOR} label="Light Mode" percentage={formatPercentage(summary.light_percentage ?? 0)} /><LegendItem color={DARK_COLOR} label="Dark Mode" percentage={formatPercentage(summary.dark_percentage ?? 0)} /></div>;
}
