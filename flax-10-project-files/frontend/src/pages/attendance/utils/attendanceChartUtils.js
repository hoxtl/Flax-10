/*
 * Attendance chart utility helpers.
 */

export function buildDonutSeries(data, valueFormatter) {
  return [{ data, innerRadius: 40, outerRadius: 90, paddingAngle: 2, cornerRadius: 4, valueFormatter }];
}

export function buildValueFormatter(data, total) {
  return (value, context) => formatPieValue(getPieValue(value, context, data), total);
}

export function buildPieClickHandler(onSegmentClick, chart, data) {
  if (!onSegmentClick) return undefined;
  return (_, identifier, item) => emitPieClick(onSegmentClick, chart, item?.label ?? data[identifier?.dataIndex]?.label);
}

function getPieValue(value, context, data) {
  if (typeof context?.dataIndex === "number" && data[context.dataIndex] != null) return Number(data[context.dataIndex].value);
  if (typeof value === "object" && value != null && "value" in value) return Number(value.value);
  return Number(value);
}

function formatPieValue(value, total) {
  if (total <= 0 || !Number.isFinite(value)) return "";
  return `${Math.round((value / total) * 100)}%`;
}

function emitPieClick(onSegmentClick, chart, label) {
  if (label) onSegmentClick(chart, label);
}
