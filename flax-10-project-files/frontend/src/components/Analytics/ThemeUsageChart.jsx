import { PieChart } from '@mui/x-charts/PieChart';
import EmptyState from '../common/EmptyState/EmptyState';

const PIE_SERIES = (summary) => [{ data: [
  { id: 0, value: summary.light_minutes, label: 'Light Mode', color: '#FFD54F' },
  { id: 1, value: summary.dark_minutes, label: 'Dark Mode', color: '#5C6BC0' },
], innerRadius: 50, outerRadius: 100, paddingAngle: 3, cornerRadius: 4 }];

const getBadge = (darkPct) => {
  if (darkPct >= 60) return '🦉 Night Owl';
  if (darkPct >= 30) return '🌗 Mixed';
  return '☀️ Day Worker';
};

const ChartHeader = ({ badge, peakDarkHour }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
    <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>{badge}</span>
    {peakDarkHour && (
      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Peak dark mode: {peakDarkHour}</span>
    )}
  </div>
);

const ChartFooter = ({ darkPct, lightPct }) => (
  <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '0.5rem' }}>
    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>🌙 Dark: {darkPct}%</span>
    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>☀️ Light: {lightPct}%</span>
  </div>
);

const ThemeUsageChart = ({ themeStats }) => {
  const { summary } = themeStats;
  const darkPct = summary.dark_percentage ?? 0;
  const lightPct = summary.light_percentage ?? 0;
  return (
    <div>
      <ChartHeader badge={getBadge(darkPct)} peakDarkHour={summary.peak_dark_hour} />
      {summary.total_minutes === 0
        ? <EmptyState icon="🌓" title="No theme session data yet" description="Keep using the app and your light/dark usage will appear here." />
        : <PieChart series={PIE_SERIES(summary)} height={220} sx={{ '& .MuiChartsLegend-label': { fill: 'var(--text) !important' } }} />
      }
      <ChartFooter darkPct={darkPct} lightPct={lightPct} />
    </div>
  );
};

export default ThemeUsageChart;
