/*
 * Theme usage chart helpers.
 */

export const LIGHT_COLOR = "#FFD54F";
export const DARK_COLOR = "#5C6BC0";

export const formatPercentage = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0%";
  const rounded = Math.round(num * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
};

export const getBadge = (darkPct) => {
  if (darkPct >= 60) return "🦉 Night Owl";
  if (darkPct >= 30) return "🌗 Mixed";
  return "☀️ Day Worker";
};

export const getPieSeries = (summary) => [{
  data: [
    { id: 0, value: summary.light_minutes, label: `Light Mode ${formatPercentage(summary.light_percentage ?? 0)}`, color: LIGHT_COLOR },
    { id: 1, value: summary.dark_minutes, label: `Dark Mode ${formatPercentage(summary.dark_percentage ?? 0)}`, color: DARK_COLOR },
  ],
  innerRadius: 50,
  outerRadius: 100,
  paddingAngle: 3,
  cornerRadius: 4,
}];
