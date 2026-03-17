import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme } from '../../context/ThemeContext';

const StudyHoursChart = ({ data }) => {
  const { mode: theme } = useTheme();
  const dates = data.map(d => new Date(d.date));
  const studyHours = data.map(d => (d.work / 60).toFixed(1));
  const breakHours = data.map(d => (d.break / 60).toFixed(1));

  const textColor = theme === 'dark' ? 'rgba(200,184,164,0.85)' : 'rgba(43,30,20,0.55)';
  const gridColor = theme === 'dark' ? 'rgba(180,164,144,0.2)' : 'rgba(74,52,33,0.15)';

  return (
    <LineChart
      xAxis={[{
        data: dates,
        scaleType: 'time',
        valueFormatter: (date) => date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        tickLabelStyle: { fill: textColor, fontSize: 11 },
      }]}
      yAxis={[{ tickLabelStyle: { fill: textColor, fontSize: 11 } }]}
      series={[
        { data: studyHours, label: 'Study Hours', color: '#4CAF50', curve: 'natural' },
        { data: breakHours, label: 'Break Hours', color: '#FF9800', curve: 'natural' },
      ]}
      height={300}
      margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
      grid={{ horizontal: true }}
      sx={{
        '& .MuiChartsGrid-line': { stroke: gridColor },
        '& .MuiChartsLegend-label': { fill: `${textColor} !important` },
        '& .MuiChartsAxis-line': { stroke: gridColor },
        '& .MuiChartsAxis-tick': { stroke: gridColor },
      }}
    />
  );
};

export default StudyHoursChart;