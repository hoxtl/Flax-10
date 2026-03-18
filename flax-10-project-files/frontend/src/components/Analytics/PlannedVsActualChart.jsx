import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '../../context/ThemeContext';
import { getChartColors, getChartSx } from './utils/chartColors';

const FLAX_BROWN = '#7B6751';
const SAGE_GREEN = '#8C9A86';
const FONT_MONO = '"JetBrains Mono", "Roboto Mono", ui-monospace, monospace';
const FONT_HEADING = '"Lexend", system-ui, sans-serif';
const CHART_MARGIN = { left: 50, right: 20, top: 20, bottom: 38 };
const DATE_FORMAT = { weekday: 'short', day: 'numeric' };
const WARM_COLORS = { textColor: 'rgba(123, 103, 81, 0.7)', gridColor: 'rgba(123, 103, 81, 0.12)' };

const toDate = (d) => new Date(d.date).toLocaleDateString('en-GB', DATE_FORMAT);
const toPlanned = (d) => parseFloat(d.planned_hours) || 0;
const toActual = (d) => parseFloat(d.actual_hours) || 0;

const PlannedVsActualChart = ({ data = [], variant }) => {
  const { mode: theme } = useTheme();
  const isWarm = variant === 'warm';
  const { textColor, gridColor } = isWarm ? WARM_COLORS : getChartColors(theme);
  const last14 = (Array.isArray(data) ? data : []).slice(-14);
  const maxVal = Math.max(0.5, ...last14.map(toPlanned), ...last14.map(toActual));
  const tickStyle = { fill: textColor, fontSize: 11, fontFamily: FONT_MONO };
  const sx = { ...getChartSx(textColor, gridColor), '& .MuiChartsLegend-label': { fill: `${textColor} !important`, fontFamily: FONT_HEADING } };
  return (
    <BarChart
      xAxis={[{ scaleType: 'band', data: last14.map(toDate), tickLabelStyle: tickStyle }]}
      yAxis={[{ tickLabelStyle: tickStyle, max: Math.ceil(maxVal) + 1 }]}
      series={[
        { data: last14.map(toPlanned), label: 'Planned (hrs)', color: isWarm ? FLAX_BROWN : '#90CAF9' },
        { data: last14.map(toActual), label: 'Actual (hrs)', color: isWarm ? SAGE_GREEN : '#4CAF50' },
      ]}
      height={300}
      margin={CHART_MARGIN}
      sx={sx}
    />
  );
};

export default PlannedVsActualChart;
