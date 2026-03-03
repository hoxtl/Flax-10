import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '../../context/ThemeContext';

const FLAX_BROWN = '#7B6751';
const SAGE_GREEN = '#8C9A86';

const PlannedVsActualChart = ({ data = [], variant }) => {
  const { theme } = useTheme();
  const isWarm = variant === 'warm';
  const last14 = (Array.isArray(data) ? data : []).slice(-14);
  const dates = last14.map(d => new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }));
  const plannedHours = last14.map(d => parseFloat(d.planned_hours) || 0);
  const actualHours = last14.map(d => parseFloat(d.actual_hours) || 0);
  const maxVal = Math.max(0.5, ...plannedHours, ...actualHours);
  const yMax = Math.ceil(maxVal) + 1;

  const textColor = isWarm
    ? 'rgba(123, 103, 81, 0.7)'
    : theme === 'dark' ? 'rgba(200,184,164,0.85)' : 'rgba(43,30,20,0.55)';
  const gridColor = isWarm
    ? 'rgba(123, 103, 81, 0.12)'
    : theme === 'dark' ? 'rgba(180,164,144,0.2)' : 'rgba(74,52,33,0.15)';
  const plannedColor = isWarm ? FLAX_BROWN : '#90CAF9';
  const actualColor = isWarm ? SAGE_GREEN : '#4CAF50';
  const fontMono = '"JetBrains Mono", "Roboto Mono", ui-monospace, monospace';
  const fontHeading = '"Lexend", system-ui, sans-serif';

  return (
    <BarChart
      xAxis={[{
        scaleType: 'band',
        data: dates,
        tickLabelStyle: { fill: textColor, fontSize: 11, fontFamily: fontMono },
      }]}
      yAxis={[{
        tickLabelStyle: { fill: textColor, fontSize: 11, fontFamily: fontMono },
        max: yMax,
      }]}
      series={[
        { data: plannedHours, label: 'Planned (hrs)', color: plannedColor },
        { data: actualHours, label: 'Actual (hrs)', color: actualColor },
      ]}
      height={300}
      margin={{ left: 50, right: 20, top: 20, bottom: 38 }}
      sx={{
        '& .MuiChartsGrid-line': { stroke: gridColor },
        '& .MuiChartsLegend-label': { fill: `${textColor} !important`, fontFamily: fontHeading },
        '& .MuiChartsAxis-line': { stroke: gridColor },
        '& .MuiChartsAxis-tick': { stroke: gridColor },
      }}
    />
  );
};

export default PlannedVsActualChart;