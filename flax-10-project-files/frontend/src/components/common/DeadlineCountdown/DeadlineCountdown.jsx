/*
 * Shared deadline countdown and urgency display.
 */

import { Clock } from "lucide-react";
import styles from "./DeadlineCountdown.module.css";
import {
  PRIORITY_PILL,
  getDaysLabel,
  getDueStatusClass,
  getUrgencyTier,
  isUrgentTier,
} from "./deadlineCountdownUtils";

function buildClassName(parts) {
  return parts.filter(Boolean).join(" ");
}

export default function DeadlineCountdown({
  dueDate,
  className = "",
  align = "end",
  showPriority = true,
  forceClock = false,
  tier: forcedTier,
  label,
}) {
  if (!dueDate && !label) return null;
  const tier = forcedTier || (dueDate ? getUrgencyTier(dueDate) : "distant");
  const pill = showPriority ? PRIORITY_PILL[tier] : null;
  const daysLabel = label || (dueDate ? getDaysLabel(dueDate) : "");
  return (
    <div className={buildClassName([styles.wrapper, align === "start" ? styles.alignStart : styles.alignEnd, className])}>
      {pill ? <span className={buildClassName([styles.priorityPill, styles[pill.cls]])}>{pill.marks} {pill.label}</span> : null}
      {daysLabel ? (
        <span className={buildClassName([styles.daysLabel, styles[getDueStatusClass(tier)]])}>
          {(forceClock || isUrgentTier(tier)) ? <Clock size={12} className={styles.icon} /> : null}
          {daysLabel}
        </span>
      ) : null}
    </div>
  );
}
