import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '../../context/ThemeContext';

const PlannedVsActualChart = ({ data }) => {
  const { theme } = useTheme();
  const last14 = data.slice(-14);
  const dates = last14.map(d => new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }));
  const plannedHours = last14.map(d => parseFloat(d.planned_hours));
  const actualHours = last14.map(d => parseFloat(d.actual_hours));

  const textColor = theme === 'dark' ? 'rgba(200,184,164,0.85)' : 'rgba(43,30,20,0.55)';
  const gridColor = theme === 'dark' ? 'rgba(180,164,144,0.2)' : 'rgba(74,52,33,0.15)';

  return (
    <BarChart
      xAxis={[{
        scaleType: 'band',
        data: dates,
        tickLabelStyle: { fill: textColor, fontSize: 11 },
      }]}
      yAxis={[{ tickLabelStyle: { fill: textColor, fontSize: 11 } }]}
      series={[
        { data: plannedHours, label: 'Planned (hrs)', color: '#90CAF9' },
        { data: actualHours, label: 'Actual (hrs)', color: '#4CAF50' },
      ]}
      height={300}
      margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
      sx={{
        '& .MuiChartsGrid-line': { stroke: gridColor },
        '& .MuiChartsLegend-label': { fill: `${textColor} !important` },
        '& .MuiChartsAxis-line': { stroke: gridColor },
        '& .MuiChartsAxis-tick': { stroke: gridColor },
      }}
    />
  );
};

export default PlannedVsActualChart;