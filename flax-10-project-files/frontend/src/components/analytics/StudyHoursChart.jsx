/*
 * Study hours analytics chart.
 */

import { LineChart } from "@mui/x-charts/LineChart";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useTheme } from "../../context/ThemeContext";
import { getChartMargin, getStudyHoursAxis, getStudyHoursSeries } from "./studyHoursChartConfig";
import { getChartColors, getChartSx } from "./utils/chartColors";

export default function StudyHoursChart({ data }) {
  const { mode: theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { textColor, gridColor } = getChartColors(theme);
  return <LineChart xAxis={getStudyHoursAxis(data, textColor)} yAxis={[{ tickLabelStyle: { fill: textColor, fontSize: 11 } }]} series={getStudyHoursSeries(data)} height={300} margin={getChartMargin(isMobile)} grid={{ horizontal: true }} sx={getChartSx(textColor, gridColor)} />;
}
