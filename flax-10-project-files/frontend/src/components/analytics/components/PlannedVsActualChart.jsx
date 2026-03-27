/*
 * Planned versus actual study chart.
 */

import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '../../../context/ThemeContext';
import { getChartColors, getChartSx } from '../utils/chartColors';

const FLAX_BROWN = 'var(--color-primary)';
const SAGE_GREEN = 'var(--sage)';
const FONT_MONO = '"JetBrains Mono", "Roboto Mono", ui-monospace, monospace';
const CHART_MARGIN = { left: 50, right: 20, top: 20, bottom: 38 };
const DATE_FORMAT = { weekday: 'short', day: 'numeric' };
const WARM_COLORS = { textColor: 'var(--chart-warm-text)', gridColor: 'var(--chart-warm-grid)' };

const toDate = (d) => new Date(d.date).toLocaleDateString('en-GB', DATE_FORMAT);
const toPlanned = (d) => parseFloat(d.planned_hours) || 0;
const toActual = (d) => parseFloat(d.actual_hours) || 0;
const getLast14 = (data) => (Array.isArray(data) ? data : []).slice(-14);
const getMaxValue = (data) => Math.max(0.5, ...data.map(toPlanned), ...data.map(toActual));
const getTickStyle = (textColor) => ({ fill: textColor, fontSize: 11, fontFamily: FONT_MONO });

function getChartPalette(theme, variant) {
  const isWarm = variant === 'warm';
  const base = isWarm ? WARM_COLORS : getChartColors(theme);
  return { ...base, isWarm };
}

function getChartSxConfig(textColor, gridColor) {
  return {
    ...getChartSx(textColor, gridColor),
    '& .MuiChartsLegend-label': { fill: `${textColor} !important` },
  };
}

const PlannedVsActualChart = ({ data = [], variant }) => {
  const { gridColor, isWarm, textColor } = getChartPalette(useTheme().mode, variant);
  const last14 = getLast14(data);
  const maxVal = getMaxValue(last14), tickStyle = getTickStyle(textColor);
  const sx = getChartSxConfig(textColor, gridColor);
  return (
    <BarChart
      xAxis={[{ scaleType: 'band', data: last14.map(toDate), tickLabelStyle: tickStyle }]}
      yAxis={[{ tickLabelStyle: tickStyle, max: Math.ceil(maxVal) + 1 }]}
      series={[
        { data: last14.map(toPlanned), label: 'Planned (hrs)', color: isWarm ? FLAX_BROWN : 'var(--chart-accent-blue)' },
        { data: last14.map(toActual), label: 'Actual (hrs)', color: isWarm ? SAGE_GREEN : 'var(--chart-study)' },
      ]}
      height={300}
      margin={CHART_MARGIN}
      sx={sx}
    />
  );
};

export default PlannedVsActualChart;
