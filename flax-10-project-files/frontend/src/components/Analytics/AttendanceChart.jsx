import useMediaQuery from "@mui/material/useMediaQuery";
import { Link } from "react-router-dom";

import buttonStyles from "../common/PrimaryButton/PrimaryButton.module.css";
import { useTheme } from "../../context/ThemeContext";

import AttendanceBarChart from "./AttendanceBarChart";
import AttendanceSummary from "./AttendanceSummary";
import { MUTED_STYLE, getAttendancePercentage, recordLinkStyle } from "./attendanceChartConfig";
import useAttendanceStats from "./useAttendanceStats";
import { getChartColors } from "./utils/chartColors";

const viewAllClassName = [
  buttonStyles.btn,
  buttonStyles.small,
  buttonStyles.primary,
  buttonStyles.pill,
].join(" ");

const NoAttendanceMsg = () => (
  <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: 0 }}>
    No attendance recorded yet.{" "}
    <Link to="/attendance" style={recordLinkStyle}>Record attendance</Link>
  </p>
);

function AttendanceContent({ byType, gridColor, isMobile, overall, textColor }) {
  const pct = getAttendancePercentage(overall);
  const types = Object.keys(byType);
  return <div><AttendanceSummary className={viewAllClassName} overall={overall} pct={pct} textColor={textColor} />{types.length === 0 ? <NoAttendanceMsg /> : <AttendanceBarChart byType={byType} gridColor={gridColor} isMobile={isMobile} textColor={textColor} types={types} />}</div>;
}

export default function AttendanceChart() {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { stats, loading } = useAttendanceStats();
  const { textColor, gridColor } = getChartColors(theme);
  if (loading) return <p style={MUTED_STYLE}>Loading attendance…</p>;
  if (!stats) return <p style={MUTED_STYLE}>Attendance data unavailable.</p>;
  return <AttendanceContent byType={stats.by_type} gridColor={gridColor} isMobile={isMobile} overall={stats.overall} textColor={textColor} />;
}
