import { PieChart } from '@mui/x-charts/PieChart';
import { useTheme } from '../../context/ThemeContext';

const ThemeUsageChart = ({ themeStats }) => {
  const { theme } = useTheme();
  const { summary } = themeStats;
  const textColor = theme === 'dark' ? '#e0e0e0' : '#333';
  const data = [
    { id: 0, value: summary.light_minutes, label: 'Light Mode', color: '#FFD54F' },
    { id: 1, value: summary.dark_minutes, label: 'Dark Mode', color: '#5C6BC0' },
  ];
  const nightOwlBadge = summary.is_night_owl ? '🦉 Night Owl' : '☀️ Day Worker';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{nightOwlBadge}</span>
        {summary.peak_dark_hour && (
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Peak dark mode: {summary.peak_dark_hour}
          </span>
        )}
      </div>
      {summary.total_minutes === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          No theme session data yet — keep using the app and it will appear here.
        </p>
      ) : (
        <PieChart
          series={[{ data, innerRadius: 50, outerRadius: 100, paddingAngle: 3, cornerRadius: 4 }]}
          height={220}
          sx={{ '& .MuiChartsLegend-label': { fill: textColor } }}
        />
      )}
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>🌙 Dark: {summary.dark_percentage}%</span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>☀️ Light: {summary.light_percentage}%</span>
      </div>
    </div>
  );
};

export default ThemeUsageChart;
