/*
 * Productivity card definitions.
 */

const CARD_DEFINITIONS = [
  { color: "#2196F3", icon: "⚖️", label: "Work / Break Ratio", subtitle: "Work per break minute", value: (summary) => (summary.work_break_ratio ? `${summary.work_break_ratio}:1` : null) },
  { color: "#F44336", icon: "🚀", label: "Overtime Sessions", subtitle: "Ran past planned time", value: (summary) => summary.overtime_sessions },
  { color: "#9C27B0", icon: "🎯", label: "Schedule Adherence", subtitle: "Actual vs planned", unit: "%", value: (_, progressSummary) => progressSummary?.adherence_percentage },
  { color: "#FF9800", icon: "📅", label: "Planned Hours", subtitle: "From your calendar", unit: "hrs", value: (_, progressSummary) => progressSummary?.total_planned_hours },
];

export const buildCardsConfig = (summary, progressSummary) =>
  CARD_DEFINITIONS.map((item) => ({ ...item, value: item.value(summary, progressSummary) }));
