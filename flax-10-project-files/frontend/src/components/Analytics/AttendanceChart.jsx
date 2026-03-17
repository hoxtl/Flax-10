import { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '../../context/ThemeContext';
import { getAttendanceStats } from '../../api/attendanceApi';
import { Link } from 'react-router-dom';

const ATTENDED_COLOR = '#5a9e74';
const MISSED_COLOR = '#c07060';

export default function AttendanceChart() {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAttendanceStats()
      .then(data => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const textColor = theme === 'dark' ? 'rgba(200,184,164,0.85)' : 'rgba(43,30,20,0.55)';
  const gridColor = theme === 'dark' ? 'rgba(180,164,144,0.2)' : 'rgba(74,52,33,0.15)';

  if (loading) {
    return <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Loading attendance…</p>;
  }

  if (!stats) {
    return <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Attendance data unavailable.</p>;
  }

  const { overall, by_type } = stats;
  const total = overall.attended + overall.missed;
  const pct = total > 0 ? Math.round((overall.attended / total) * 100) : 0;

  const types = Object.keys(by_type);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {pct}%
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)', marginLeft: '0.4rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              attended
            </span>
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: textColor }}>
              <span style={{ color: ATTENDED_COLOR, fontWeight: 700 }}>{overall.attended}</span> attended
            </span>
            <span style={{ fontSize: '0.75rem', color: textColor }}>
              <span style={{ color: MISSED_COLOR, fontWeight: 700 }}>{overall.missed}</span> missed
            </span>
          </div>
        </div>
        <Link
          to="/attendance"
          style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}
        >
          View all →
        </Link>
      </div>

      {types.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
          No attendance recorded yet.{' '}
          <Link to="/attendance" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Record attendance</Link>
        </p>
      ) : (
        <BarChart
          xAxis={[{
            scaleType: 'band',
            data: types,
            tickLabelStyle: { fill: textColor, fontSize: 11 },
          }]}
          yAxis={[{ tickLabelStyle: { fill: textColor, fontSize: 11 } }]}
          series={[
            { data: types.map(t => by_type[t].attended), label: 'Attended', color: ATTENDED_COLOR },
            { data: types.map(t => by_type[t].missed), label: 'Missed', color: MISSED_COLOR },
          ]}
          height={240}
          margin={{ left: 40, right: 20, top: 10, bottom: 40 }}
          grid={{ horizontal: true }}
          sx={{
            '& .MuiChartsGrid-line': { stroke: gridColor },
            '& .MuiChartsLegend-label': { fill: `${textColor} !important` },
            '& .MuiChartsAxis-line': { stroke: gridColor },
            '& .MuiChartsAxis-tick': { stroke: gridColor },
          }}
        />
      )}
    </div>
  );
}
