<<<<<<< HEAD
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
=======
import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme } from '../../context/ThemeContext';
import { getChartColors, getChartSx } from './utils/chartColors';

const CHART_MARGIN = { left: 50, right: 20, top: 20, bottom: 50 };
const toDate = (d) => new Date(d.date);
const toStudyHour = (d) => (d.work / 60).toFixed(1);
const toBreakHour = (d) => (d.break / 60).toFixed(1);
const formatDate = (date) => date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

const StudyHoursChart = ({ data, row = 2 }) => {
  const { mode: theme } = useTheme();
  const { textColor, gridColor } = getChartColors(theme);
  const tickStyle = { fill: textColor, fontSize: 11 };

  // 1H is 9rem (~144px), 2H is 19.4rem (~310px) given gap 16px
  const calculatedHeight = Math.max(160, row * 160 + (row - 1) * 16 - 40);

  return (
    <LineChart
      xAxis={[{ data: data.map(toDate), scaleType: 'time', valueFormatter: formatDate, tickLabelStyle: tickStyle }]}
      yAxis={[{ tickLabelStyle: tickStyle }]}
      series={[
        { data: data.map(toStudyHour), label: 'Study Hours', color: '#4CAF50', curve: 'natural' },
        { data: data.map(toBreakHour), label: 'Break Hours', color: '#FF9800', curve: 'natural' },
      ]}
      height={calculatedHeight}
      margin={CHART_MARGIN}
      grid={{ horizontal: true }}
      sx={{
        ...getChartSx(textColor, gridColor),
        touchAction: 'none',
      }}
    />
  );
};

export default StudyHoursChart;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
