/*
 * Shared helpers for grouped conflict rows.
 */

import { formatHour12h } from "../../../utils/dateFormatUtils";
import { DAY_START_HOUR } from "../../../utils/timelineUtils";

export function getConflictTimeLabel(row) {
  return formatHour12h(
    Math.floor(DAY_START_HOUR + row.startMins / 60),
    row.startMins % 60
  );
}
