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

function PriorityPillBadge({ pill }) {
  if (!pill) return null;
  return <span className={buildClassName([styles.priorityPill, styles[pill.cls]])}>{pill.marks} {pill.label}</span>;
}

function DaysLabelBadge({ daysLabel, forceClock, tier }) {
  if (!daysLabel) return null;
  return (
    <span className={buildClassName([styles.daysLabel, styles[getDueStatusClass(tier)]])}>
      {(forceClock || isUrgentTier(tier)) ? <Clock size={12} className={styles.icon} /> : null}
      {daysLabel}
    </span>
  );
}

/** Deadline countdown pill showing urgency tier and days remaining. */
export default function DeadlineCountdown({ dueDate, className = "", align = "end", showPriority = true, forceClock = false, tier: forcedTier, label }) {
  if (!dueDate && !label) return null;
  const tier = forcedTier || (dueDate ? getUrgencyTier(dueDate) : "distant");
  const pill = showPriority ? PRIORITY_PILL[tier] : null;
  const daysLabel = label || (dueDate ? getDaysLabel(dueDate) : "");
  const alignClass = align === "start" ? styles.alignStart : styles.alignEnd;
  return (
    <div className={buildClassName([styles.wrapper, alignClass, className])}>
      <PriorityPillBadge pill={pill} />
      <DaysLabelBadge daysLabel={daysLabel} forceClock={forceClock} tier={tier} />
    </div>
  );
}
