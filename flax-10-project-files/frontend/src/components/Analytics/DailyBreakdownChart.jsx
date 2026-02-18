import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '../../context/ThemeContext';

const DailyBreakdownChart = ({ data }) => {
  const { theme } = useTheme();
  
  // Get last 7 days for better readability
  const last7Days = data.slice(-7);
  
  const dates = last7Days.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
  });
  
  const workMinutes = last7Days.map(d => d.work);
  const breakMinutes = last7Days.map(d => d.break);

  const chartColors = theme === 'dark' 
    ? { text: '#e0e0e0', grid: '#424242' }
    : { text: '#333', grid: '#e0e0e0' };

  return (
    <BarChart
      xAxis={[{ 
        scaleType: 'band', 
        data: dates,
      }]}
      series={[
        { 
          data: workMinutes, 
          label: 'Work (min)', 
          color: '#4CAF50',
          stack: 'total',
        },
        { 
          data: breakMinutes, 
          label: 'Break (min)', 
          color: '#FF9800',
          stack: 'total',
        }
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

export default DailyBreakdownChart;
