/*
 * Daily breakdown chart config helpers.
 */

export const CHART_MARGIN = { left: 50, right: 20, top: 20, bottom: 50 };
export const DATE_FORMAT = { weekday: "short", day: "numeric" };

export const getChartMargin = (isMobile) =>
  (isMobile ? { left: 28, right: 10, top: 20, bottom: 44 } : CHART_MARGIN);

export const getBreakdownColors = (theme) => ({
  barColor: theme === "sage" ? "var(--chart-study-sage)" : "var(--chart-study)",
  breakColor: theme === "sage" ? "var(--chart-study-sage-alpha)" : "var(--chart-break)",
});

export const getBreakdownAxis = (data, textColor) => [{
  scaleType: "band",
  data: data.map((item) => new Date(item.date).toLocaleDateString("en-GB", DATE_FORMAT)),
  tickLabelStyle: { fill: textColor, fontSize: 11 },
}];

export const getBreakdownSeries = (data, colors) => [
  { data: data.map((item) => item.work ?? 0), label: "Work (min)", color: colors.barColor, stack: "total" },
  { data: data.map((item) => item.break ?? 0), label: "Break (min)", color: colors.breakColor, stack: "total" },
];
