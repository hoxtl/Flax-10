/*
 * Daily breakdown analytics chart.
 */

import { BarChart } from "@mui/x-charts/BarChart";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useTheme } from "../../context/ThemeContext";
import { getBreakdownAxis, getBreakdownColors, getBreakdownSeries, getChartMargin } from "./dailyBreakdownChartConfig";
import { getChartColors, getChartSx } from "./utils/chartColors";

export default function DailyBreakdownChart({ data, theme: themeProp, height = 300 }) {
  const { mode: theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { textColor, gridColor } = getChartColors(themeProp ?? theme);
  const last7 = data?.slice(-7) ?? [];
  const colors = getBreakdownColors(themeProp);
  return <BarChart xAxis={getBreakdownAxis(last7, textColor)} yAxis={[{ tickLabelStyle: { fill: textColor, fontSize: 11 } }]} series={getBreakdownSeries(last7, colors)} height={height} margin={getChartMargin(isMobile)} sx={getChartSx(textColor, gridColor)} />;
}
