import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme } from '../../context/ThemeContext';

const StudyHoursChart = ({ data }) => {
  const { theme } = useTheme();
  
  // Transform backend data for the chart
  const dates = data.map(d => new Date(d.date));
  const studyHours = data.map(d => (d.work / 60).toFixed(1)); // Convert minutes to hours
  const breakHours = data.map(d => (d.break / 60).toFixed(1));

  const chartColors = theme === 'dark' 
    ? { text: '#e0e0e0', grid: '#424242' }
    : { text: '#333', grid: '#e0e0e0' };

  return (
    <LineChart
      xAxis={[{ 
        data: dates,
        scaleType: 'time',
        valueFormatter: (date) => date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
      }]}
      series={[
        {
          data: studyHours,
          label: 'Study Hours',
          color: '#4CAF50',
          curve: 'natural',
        },
        {
          data: breakHours,
          label: 'Break Hours',
          color: '#FF9800',
          curve: 'natural',
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

export default StudyHoursChart;
