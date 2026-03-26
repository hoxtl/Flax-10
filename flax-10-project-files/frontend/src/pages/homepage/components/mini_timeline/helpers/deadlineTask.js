/*
 * Builds synthetic deadline tasks for study gaps.
 */

export function buildDeadlineTask(row, deadlineSuggestion) {
  if (!deadlineSuggestion) return null;
  return {
    title: `Revision: ${deadlineSuggestion.assessment_title || deadlineSuggestion.title}`,
    estimated_blocks: Math.max(1, Math.round(row.minutes / 25)),
    due_date: deadlineSuggestion.start_due_date,
    priority: "urgent",
  };
}
