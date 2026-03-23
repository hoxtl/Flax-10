/*
 * Attendance chart summary header.
 */

import { Link } from "react-router-dom";

import { ATTENDED_COLOR, MISSED_COLOR, countsStyle, headerStyle, leftGroupStyle, percentageLabelStyle, percentageStyle, viewAllLinkStyle } from "./attendanceChartConfig";
import chartStyles from "./Charts.module.css";

function SummaryCount({ color, label, textColor, value }) {
  return <span className={chartStyles.summaryCount} style={{ color: textColor }}><span style={{ color, fontWeight: 700 }}>{value}</span>{" "}{label}</span>;
}

function SummaryRate({ pct }) {
  return <span style={percentageStyle}>{pct}%<span style={percentageLabelStyle}>attended</span></span>;
}

function ViewAllButton({ className }) {
  return <Link to="/attendance" className={className} style={viewAllLinkStyle}>View all →</Link>;
}

export default function AttendanceSummary({ className, overall, pct, textColor }) {
  return <div style={headerStyle}><div style={leftGroupStyle}><SummaryRate pct={pct} /><div style={countsStyle}><SummaryCount color={ATTENDED_COLOR} label="attended" textColor={textColor} value={overall.attended} /><SummaryCount color={MISSED_COLOR} label="missed" textColor={textColor} value={overall.missed} /></div></div><ViewAllButton className={className} /></div>;
}
