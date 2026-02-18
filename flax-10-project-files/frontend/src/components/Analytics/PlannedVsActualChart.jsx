import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '../../context/ThemeContext';

const PlannedVsActualChart = ({ data }) => {
  const { theme } = useTheme();

  const last14 = data.slice(-14);

  const dates = last14.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
  });

  const plannedHours = last14.map(d => parseFloat(d.planned_hours));
  const actualHours = last14.map(d => parseFloat(d.actual_hours));

  const chartColors = theme === 'dark'
    ? { text: '#e0e0e0', grid: '#424242' }
    : { text: '#333', grid: '#e0e0e0' };

  return (
    <BarChart
      xAxis={[{ scaleType: 'band', data: dates }]}
      series={[
        { data: plannedHours, label: 'Planned (hrs)', color: '#90CAF9' },
        { data: actualHours, label: 'Actual (hrs)', color: '#4CAF50' },
      ]}
      height={300}
      margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
      sx={{
        '& .MuiChartsAxis-label': { fill: chartColors.text },
        '& .MuiChartsAxis-tickLabel': { fill: chartColors.text },
        '& .MuiChartsLegend-label': { fill: chartColors.text },
        '& .MuiChartsGrid-line': { stroke: chartColors.grid },
      }}
    />
  );
};

export default PlannedVsActualChart;
