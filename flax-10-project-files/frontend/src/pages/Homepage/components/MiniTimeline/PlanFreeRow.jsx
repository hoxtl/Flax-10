/*
 * Plan timeline free-gap row.
 */

import { getGapStartDate } from "../../utils/timelineUtils";
import { buildDeadlineTask } from "./helpers/deadlineTask";
import { formatGapDuration, getGapMinHeight, getGapTimeLabel } from "./helpers/gapRowUtils";
import { PlanFreeRowContent } from "./parts/PlanFreeRowContent";
import { TimelineGutter, TimelineRowLayout, TimelineSpineCell } from "./parts/TimelineRowLayout";

function getCandidateTask(row, assignedTask, deadlineSuggestions) {
  return assignedTask || buildDeadlineTask(row, deadlineSuggestions[0] ?? null);
}

function getGapContext(row) {
  return row.gapContext || { type: "study" };
}

export function PlanFreeRow({ row, deadlineSuggestions = [], onQuickStart, selectedDate, styles, isBestGap = false, assignedTask = null, nextAssignedTask = null, onSkipTask = null }) {
  const gapContext = getGapContext(row);
  const candidateTask = getCandidateTask(row, assignedTask, deadlineSuggestions);
  const handleStartTask = (task) => onQuickStart?.(getGapStartDate(selectedDate, row.gapStartMins), row.minutes, task, nextAssignedTask);
  return <TimelineRowLayout row={row} styles={styles} rowClassName={styles.planTimelineRowGap} minHeight={getGapMinHeight(row.minutes, row.gapStartMins)}><TimelineGutter row={row} styles={styles} timeLabel={getGapTimeLabel(row.gapStartMins)} /><TimelineSpineCell styles={styles} /><PlanFreeRowContent styles={styles} gapContext={gapContext} durationLabel={formatGapDuration(row.minutes)} assignedTask={assignedTask} candidateTask={candidateTask} isBestGap={isBestGap} onSkipTask={onSkipTask} onStartTask={handleStartTask} /></TimelineRowLayout>;
}
