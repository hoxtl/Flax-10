/*
 * Theme usage chart header.
 */

const headerStyle = { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap", minWidth: 0 };
const badgeStyle = { fontSize: "1.25rem", fontWeight: 600, color: "var(--text)", minWidth: 0 };
const detailStyle = { fontSize: "0.8rem", color: "var(--muted)", minWidth: 0 };

function PeakHour({ peakDarkHour }) {
  return peakDarkHour ? <span style={detailStyle}>Peak dark mode: {peakDarkHour}</span> : null;
}

export default function ThemeUsageHeader({ badge, peakDarkHour }) {
  return <div style={headerStyle}><span style={badgeStyle}>{badge}</span><PeakHour peakDarkHour={peakDarkHour} /></div>;
}
