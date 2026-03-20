export const PRIORITY_COLORS = {
  urgent: '#FF4444',
  high: '#FF8800',
  medium: '#4488FF',
  low: '#888888',
};

export const LEG_MODE_ICONS = {
  walking: '🚶',
  bus: '🚌',
  tube: '🚇',
  dlr: '🚊',
  overground: '🚆',
  'national-rail': '🚄',
};

export function travelTime(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`;
  const hrs = Math.floor(mins / 60);
  const minsLeft = mins % 60;
  return `${hrs}h ${minsLeft}m`;
}

export function travelDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority] ?? '#4488FF';
}

export function getLegIcon(mode) {
  return LEG_MODE_ICONS[mode] ?? '🚇';
}

export function getLegLabel(leg) {
  if (leg.mode === 'walking') return 'Walk';
  if (leg.mode === 'bus') return `Bus ${leg.routeOptions[0]?.name || ''}`;
  return leg.routeOptions[0]?.name || leg.mode;
}
