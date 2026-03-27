/*
 * Attendance analytics bar chart.
 */

import { BarChart } from "@mui/x-charts/BarChart";

import { getChartSx } from "../utils/chartColors";
import { getAttendanceMargin, getAttendanceSeries } from "../utils/attendanceChartConfig";

const getAxis = (types, textColor) => [{ scaleType: "band", data: types, tickLabelStyle: { fill: textColor, fontSize: 11 } }];
const getYAxis = (textColor) => [{ tickLabelStyle: { fill: textColor, fontSize: 11 } }];

export default function AttendanceBarChart({ byType, gridColor, isMobile, textColor, types }) {
  return <BarChart xAxis={getAxis(types, textColor)} yAxis={getYAxis(textColor)} series={getAttendanceSeries(types, byType)} height={240} margin={getAttendanceMargin(isMobile)} grid={{ horizontal: true }} sx={getChartSx(textColor, gridColor)} />;
}
