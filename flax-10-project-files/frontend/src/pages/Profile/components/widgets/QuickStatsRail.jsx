import StatStrip from '../../../../components/Common/StatStrip/StatStrip';
import { useCountUp } from '../../../../hooks/useCountUp';

export function QuickStatsRail({ totalHours, sessionCount, moduleCount, hideZeroItems = false }) {
  const hours = Math.round(totalHours || 0);
  const hoursRef = useCountUp(hours, 1200);
  const sessionsRef = useCountUp(sessionCount || 0, 1200);
  const modulesRef = useCountUp(moduleCount || 0, 1200);
  const items = [
    { key: 'total-focus', label: 'Total Focus', value: hours, valueRef: hoursRef, suffix: 'h' },
    { key: 'sessions', label: 'Sessions', value: sessionCount || 0, valueRef: sessionsRef },
    { key: 'modules', label: 'Modules', value: moduleCount || 0, valueRef: modulesRef },
  ].filter((item) => !hideZeroItems || item.value > 0);
  if (!items.length) return null;
  return <StatStrip items={items} />;
}
