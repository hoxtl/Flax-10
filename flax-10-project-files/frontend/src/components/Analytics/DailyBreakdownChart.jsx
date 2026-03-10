import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '../../context/ThemeContext';

const DailyBreakdownChart = ({ data, theme: themeProp, height = 300 }) => {
  const { mode: theme } = useTheme();
  const resolvedTheme = themeProp ?? theme;
  const last7Days = data?.slice(-7) ?? [];
  const dates = last7Days.map(d => new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }));
  const workMinutes = last7Days.map(d => d.work ?? 0);
  const breakMinutes = last7Days.map(d => d.break ?? 0);

  const textColor = resolvedTheme === 'dark' ? 'rgba(200,184,164,0.85)' : 'rgba(43,30,20,0.55)';
  const gridColor = resolvedTheme === 'dark' ? 'rgba(180,164,144,0.2)' : 'rgba(74,52,33,0.15)';
  const barColor = themeProp === 'sage' ? '#52796f' : '#4CAF50';
  const breakColor = themeProp === 'sage' ? 'rgba(82, 121, 111, 0.6)' : '#FF9800';

  return (
    <BarChart
      xAxis={[{
        scaleType: 'band',
        data: dates,
        tickLabelStyle: { fill: textColor, fontSize: 11 },
      }]}
      yAxis={[{ tickLabelStyle: { fill: textColor, fontSize: 11 } }]}
      series={[
        { data: workMinutes, label: 'Work (min)', color: barColor, stack: 'total' },
        { data: breakMinutes, label: 'Break (min)', color: breakColor, stack: 'total' },
      ]}
      height={height}
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