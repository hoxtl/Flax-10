import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '../../context/ThemeContext';

const DailyBreakdownChart = ({ data }) => {
  const { theme } = useTheme();
  const last7Days = data.slice(-7);
  const dates = last7Days.map(d => new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }));
  const workMinutes = last7Days.map(d => d.work);
  const breakMinutes = last7Days.map(d => d.break);

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
        { data: workMinutes, label: 'Work (min)', color: '#4CAF50', stack: 'total' },
        { data: breakMinutes, label: 'Break (min)', color: '#FF9800', stack: 'total' },
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

export default DailyBreakdownChart;