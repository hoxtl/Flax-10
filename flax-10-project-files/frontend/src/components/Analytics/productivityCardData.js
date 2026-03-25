/*
 * Productivity card definitions.
 */

const CARD_DEFINITIONS = [
  { color: "var(--chart-primary)", icon: "⚖️", label: "Work / Break Ratio", subtitle: "Work per break minute", value: (summary) => (summary.work_break_ratio ? `${summary.work_break_ratio}:1` : null) },
  { color: "var(--chart-accent-red)", icon: "🚀", label: "Overtime Sessions", subtitle: "Ran past planned time", value: (summary) => summary.overtime_sessions },
  { color: "var(--chart-accent-purple)", icon: "🎯", label: "Schedule Adherence", subtitle: "Actual vs planned", unit: "%", value: (_, progressSummary) => progressSummary?.adherence_percentage },
  { color: "var(--chart-break)", icon: "📅", label: "Planned Hours", subtitle: "From your calendar", unit: "hrs", value: (_, progressSummary) => progressSummary?.total_planned_hours },
];

export const buildCardsConfig = (summary, progressSummary) =>
  CARD_DEFINITIONS.map((item) => ({ ...item, value: item.value(summary, progressSummary) }));
