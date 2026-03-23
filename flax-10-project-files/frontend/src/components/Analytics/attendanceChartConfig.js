/*
 * Attendance chart config helpers.
 */

export const ATTENDED_COLOR = "var(--chart-attended)";
export const MISSED_COLOR = "var(--chart-missed)";
export const MUTED_STYLE = { color: "var(--muted)", fontSize: "0.85rem", margin: 0 };
export const CHART_MARGIN = { left: 40, right: 20, top: 10, bottom: 40 };

export const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "0.75rem",
  flexWrap: "wrap",
  gap: "0.5rem",
};

export const leftGroupStyle = { display: "flex", gap: "1.25rem", flexWrap: "wrap" };
export const percentageStyle = { fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1 };
export const percentageLabelStyle = { fontSize: "0.7rem", fontWeight: 600, color: "var(--muted)", marginLeft: "0.4rem", letterSpacing: "0.04em", textTransform: "uppercase" };
export const countsStyle = { display: "flex", gap: "0.75rem", alignItems: "center" };
export const recordLinkStyle = { color: "var(--primary)", textDecoration: "none" };
export const viewAllLinkStyle = { textDecoration: "none", fontSize: "0.72rem" };

export const getAttendanceMargin = (isMobile) =>
  (isMobile ? { left: 26, right: 10, top: 10, bottom: 40 } : CHART_MARGIN);

export const getAttendanceSeries = (types, byType) => [
  { data: types.map((type) => byType[type].attended), label: "Attended", color: ATTENDED_COLOR },
  { data: types.map((type) => byType[type].missed), label: "Missed", color: MISSED_COLOR },
];

export const getAttendancePercentage = (overall) => {
  const total = overall.attended + overall.missed;
  return total > 0 ? Math.round((overall.attended / total) * 100) : 0;
};
