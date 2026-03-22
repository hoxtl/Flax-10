/*
 * Study hours chart config helpers.
 */

export const CHART_MARGIN = { left: 50, right: 20, top: 20, bottom: 50 };
export const formatDate = (date) => date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });

export const getChartMargin = (isMobile) =>
  (isMobile ? { left: 28, right: 10, top: 20, bottom: 44 } : CHART_MARGIN);

export const getStudyHoursAxis = (data, textColor) => [{
  data: data.map((item) => new Date(item.date)),
  scaleType: "time",
  valueFormatter: formatDate,
  tickLabelStyle: { fill: textColor, fontSize: 11 },
}];

export const getStudyHoursSeries = (data) => [
  { data: data.map((item) => (item.work / 60).toFixed(1)), label: "Study Hours", color: "#4CAF50", curve: "natural" },
  { data: data.map((item) => (item.break / 60).toFixed(1)), label: "Break Hours", color: "#FF9800", curve: "natural" },
];
