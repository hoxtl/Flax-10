import { BarChart } from "@mui/x-charts/BarChart";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "../../context/ThemeContext";
import { getChartColors, getChartSx } from "./utils/chartColors";

const CHART_MARGIN = { left: 50, right: 20, top: 20, bottom: 50 };
const DATE_FORMAT = { weekday: "short", day: "numeric" };
const toDate = (d) => new Date(d.date).toLocaleDateString("en-GB", DATE_FORMAT);
const toWork = (d) => d.work ?? 0;
const toBreak = (d) => d.break ?? 0;
const getSageColors = (themeProp) => ({
  barColor: themeProp === "sage" ? "#52796f" : "#4CAF50",
  breakColor: themeProp === "sage" ? "rgba(82, 121, 111, 0.6)" : "#FF9800",
});

const DailyBreakdownChart = ({ data, theme: themeProp, height = 300 }) => {
  const { mode: theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { textColor, gridColor } = getChartColors(themeProp ?? theme);
  const { barColor, breakColor } = getSageColors(themeProp);
  const last7 = data?.slice(-7) ?? [];
  const tickStyle = { fill: textColor, fontSize: 11 };
  const chartMargin = isMobile
    ? { left: 28, right: 10, top: 20, bottom: 44 }
    : CHART_MARGIN;
  return (
    <BarChart
      xAxis={[
        {
          scaleType: "band",
          data: last7.map(toDate),
          tickLabelStyle: tickStyle,
        },
      ]}
      yAxis={[{ tickLabelStyle: tickStyle }]}
      series={[
        {
          data: last7.map(toWork),
          label: "Work (min)",
          color: barColor,
          stack: "total",
        },
        {
          data: last7.map(toBreak),
          label: "Break (min)",
          color: breakColor,
          stack: "total",
        },
      ]}
      height={height}
      margin={chartMargin}
      sx={getChartSx(textColor, gridColor)}
    />
  );
};

export default DailyBreakdownChart;
