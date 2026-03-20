import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme } from '../../context/ThemeContext';
import { getChartColors, getChartSx } from './utils/chartColors';

const CHART_MARGIN = { left: 50, right: 20, top: 20, bottom: 50 };
const toDate = (d) => new Date(d.date);
const toStudyHour = (d) => (d.work / 60).toFixed(1);
const toBreakHour = (d) => (d.break / 60).toFixed(1);
const formatDate = (date) => date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

const StudyHoursChart = ({ data }) => {
  const { mode: theme } = useTheme();
  const { textColor, gridColor } = getChartColors(theme);
  const tickStyle = { fill: textColor, fontSize: 11 };
  return (
    <LineChart
      xAxis={[{ data: data.map(toDate), scaleType: 'time', valueFormatter: formatDate, tickLabelStyle: tickStyle }]}
      yAxis={[{ tickLabelStyle: tickStyle }]}
      series={[
        { data: data.map(toStudyHour), label: 'Study Hours', color: '#4CAF50', curve: 'natural' },
        { data: data.map(toBreakHour), label: 'Break Hours', color: '#FF9800', curve: 'natural' },
      ]}
      height={300}
      margin={CHART_MARGIN}
      grid={{ horizontal: true }}
      sx={getChartSx(textColor, gridColor)}
    />
  );
};

export default StudyHoursChart;
