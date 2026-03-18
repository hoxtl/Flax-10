import { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '../../context/ThemeContext';
import { getAttendanceStats } from '../../api/attendanceApi';
import { Link } from 'react-router-dom';
import { getChartColors, getChartSx } from './utils/chartColors';

const ATTENDED_COLOR = '#5a9e74';
const MISSED_COLOR = '#c07060';
const MUTED_STYLE = { color: 'var(--muted)', fontSize: '0.85rem', margin: 0 };

const HEADER_STYLE = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' };
const LEFT_GROUP_STYLE = { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' };
const PCT_STYLE = { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 };
const PCT_LABEL_STYLE = { fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)', marginLeft: '0.4rem', letterSpacing: '0.04em', textTransform: 'uppercase' };
const COUNTS_STYLE = { display: 'flex', gap: '0.75rem', alignItems: 'center' };
const VIEW_ALL_STYLE = { fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' };
const CHART_MARGIN = { left: 40, right: 20, top: 10, bottom: 40 };

function useAttendanceStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getAttendanceStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);
  return { stats, loading };
}

const AttendanceSummary = ({ pct, overall, textColor }) => (
  <div style={HEADER_STYLE}>
    <div style={LEFT_GROUP_STYLE}>
      <span style={PCT_STYLE}>
        {pct}%<span style={PCT_LABEL_STYLE}>attended</span>
      </span>
      <div style={COUNTS_STYLE}>
        <span style={{ fontSize: '0.75rem', color: textColor }}>
          <span style={{ color: ATTENDED_COLOR, fontWeight: 700 }}>{overall.attended}</span> attended
        </span>
        <span style={{ fontSize: '0.75rem', color: textColor }}>
          <span style={{ color: MISSED_COLOR, fontWeight: 700 }}>{overall.missed}</span> missed
        </span>
      </div>
    </div>
    <Link to="/attendance" style={VIEW_ALL_STYLE}>View all →</Link>
  </div>
);

const NoAttendanceMsg = () => (
  <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
    No attendance recorded yet.{' '}
    <Link to="/attendance" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Record attendance</Link>
  </p>
);

const AttendanceBarChart = ({ types, byType, textColor, gridColor }) => (
  <BarChart
    xAxis={[{ scaleType: 'band', data: types, tickLabelStyle: { fill: textColor, fontSize: 11 } }]}
    yAxis={[{ tickLabelStyle: { fill: textColor, fontSize: 11 } }]}
    series={[
      { data: types.map(t => byType[t].attended), label: 'Attended', color: ATTENDED_COLOR },
      { data: types.map(t => byType[t].missed), label: 'Missed', color: MISSED_COLOR },
    ]}
    height={240}
    margin={CHART_MARGIN}
    grid={{ horizontal: true }}
    sx={getChartSx(textColor, gridColor)}
  />
);

export default function AttendanceChart() {
  const { theme } = useTheme();
  const { stats, loading } = useAttendanceStats();
  const { textColor, gridColor } = getChartColors(theme);
  if (loading) return <p style={MUTED_STYLE}>Loading attendance…</p>;
  if (!stats) return <p style={MUTED_STYLE}>Attendance data unavailable.</p>;
  const { overall, by_type } = stats;
  const total = overall.attended + overall.missed;
  const pct = total > 0 ? Math.round((overall.attended / total) * 100) : 0;
  const types = Object.keys(by_type);
  return (
    <div>
      <AttendanceSummary pct={pct} overall={overall} textColor={textColor} />
      {types.length === 0
        ? <NoAttendanceMsg />
        : <AttendanceBarChart types={types} byType={by_type} textColor={textColor} gridColor={gridColor} />
      }
    </div>
  );
}
