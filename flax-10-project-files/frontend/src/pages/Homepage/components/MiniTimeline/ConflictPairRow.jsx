/**
 * Conflict pair row — two (or more) overlapping events shown side-by-side
 * with an inline action bar below. No floating popover.
 */

import { AlertTriangle, RotateCw } from "lucide-react";
import { formatTime, formatHour12h } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { DAY_START_HOUR } from "../../utils/timelineUtils";
import { CAMPUS_DISPLAY } from "../../utils/planTimelineRows";
import { isReadOnlyEvent } from "../../../../components/Calendar/utils/eventUtils";
import { isDuringSleepWindow } from "../../../../components/Settings/hooks/useSleepWarning";

const EVENT_ACCENTS = {
  lecture:  "#7B9BAD",
  study:    "#9A8CB0",
  routine:  "#B8956A",
  wellness: "#7BB38E",
  social:   "#C0714E",
  society:  "#C4906A",
  meeting:  "#A08B72",
  admin:    "#C4A46D",
  default:  "#A08B72",
};

function getAccent(title, tagName) {
  const t = (title || "").toLowerCase();
  const tn = (tagName || "").toLowerCase();
  if (tn === "lecture" || /^lecture:/i.test(title)) return EVENT_ACCENTS.lecture;
  if (tn === "routine" || /^(breakfast|lunch|dinner|sleep|brunch)$/i.test(t)) return EVENT_ACCENTS.routine;
  if (tn === "wellness" || /\b(gym|yoga|run|pilates|swim|sport|exercise)\b/.test(t)) return EVENT_ACCENTS.wellness;
  if (/kclsu|society/i.test(t) || tn === "society") return EVENT_ACCENTS.society;
  if (/coffee|pub|cinema|birthday|facetime|restaurant|bar|flatmates|friends/i.test(t) || tn === "social") return EVENT_ACCENTS.social;
  if (/\b(study|library|review|revision|coursework|essay|assignment)\b/.test(t) || /academic|study/i.test(tn)) return EVENT_ACCENTS.study;
  if (/\b(meeting|seminar|tutorial|office hours|tutor)\b/.test(t)) return EVENT_ACCENTS.meeting;
  if (/shop|tesco|laundry|clean|haircut|dentist|doctor|rent|bills/i.test(t) || tn === "admin") return EVENT_ACCENTS.admin;
  return EVENT_ACCENTS.default;
}

export function ConflictPairRow({
  row,
  rows,
  onConflictAutoMove,
  onPushTomorrow,
  onCardClick,
  onEventContextMenu,
  onEdit,
  getTag,
  styles,
  selectedDate,
  sleepWindow,
}) {
  const { items } = row;
  const timeStr = formatHour12h(
    Math.floor(DAY_START_HOUR + row.startMins / 60),
    row.startMins % 60
  );

  // Prefer an event that can be auto-moved today; fallback to first movable (non-read-only) event.
  const movableWithGap = items.find((r) => {
    if (isReadOnlyEvent(r.item)) return false;
    const freeRow = rows.find(
      (fr) => fr.type === "free" && fr.gapStartMins >= row.endMins && fr.minutes >= r.durationMins,
    );
    return !!freeRow;
  });
  const movable = movableWithGap || items.find((r) => !isReadOnlyEvent(r.item)) || null;
  const freeRow = movableWithGap
    ? rows.find(
        (fr) => fr.type === "free" && fr.gapStartMins >= row.endMins && fr.minutes >= movableWithGap.durationMins,
      )
    : null;

  const handleAutoMove = () => {
    if (!freeRow || !movable || !onConflictAutoMove) return;
    const start = getGapStartDate(selectedDate, freeRow.gapStartMins);
    const end = new Date(start.getTime() + movable.durationMins * 60000);
    onConflictAutoMove(movable.item, start, end);
  };

  return (
    <div
      className={styles.planTimelineRow}
      style={{ marginTop: row.spacingBeforePx || 0 }}
    >
      {/* Gutter */}
      <div className={styles.planTimelineGutter}>
        <span className={styles.planTimelineTime}>{timeStr}</span>
      </div>
      <div className={styles.planTimelineSpineCell} aria-hidden />
      {/* Conflict group */}
      <div className={styles.planTimelineConflictPairWrap}>
        {/* Side-by-side cards */}
        <div className={styles.planTimelineConflictPairCards}>
          {items.map((r) => {
            const tagName = getTag?.(r.item.tag)?.name ?? r.item.tag_name ?? "";
            const accent = getAccent(r.item.title, tagName);
            const start = r.item.start_time ? formatTime(r.item.start_time) : "";
            const end = r.item.end_time ? formatTime(r.item.end_time) : "";
            const isSleepTime =
              !!r.item.start_time &&
              isDuringSleepWindow(
                sleepWindow?.sleepTime || "23:00",
                sleepWindow?.wakeTime || "07:00",
                new Date(r.item.start_time),
              );
            return (
              <div
                key={r.id}
                className={styles.planTimelineConflictPairCard}
                style={{ "--card-accent": accent }}
                role="button"
                tabIndex={0}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEventContextMenu?.(r.item, e.clientX, e.clientY);
                }}
                onClick={(e) => {
                  if (isReadOnlyEvent(r.item)) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (onCardClick) onCardClick(r.item, null, rect);
                  else onEdit?.(r.item, r.item.tag);
                }}
                onKeyDown={(e) => {
                  if (isReadOnlyEvent(r.item)) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (onCardClick) onCardClick(r.item, null, rect);
                    else onEdit?.(r.item, r.item.tag);
                  }
                }}
                style={{ cursor: isReadOnlyEvent(r.item) ? "default" : undefined }}
              >
                <div className={styles.planTimelineConflictPairCardAccent} aria-hidden />
                <span className={styles.planTimelineConflictPairCardTime}>
                  {start}{end && end !== start ? `–${end}` : ""}
                </span>
                <div className={styles.planTimelineConflictPairCardTitleRow}>
                  <span className={styles.planTimelineConflictPairCardTitle}>
                    {stripEmojiFromTitle(r.item.title)}
                  </span>
                  {isSleepTime && (
                    <span
                      className={styles.planTimelineConflictSleepBadge}
                      title="Scheduled during sleep hours"
                      aria-label="Scheduled during sleep hours"
                    >
                      😴
                    </span>
                  )}
                </div>
                {!freeRow && onPushTomorrow && !isReadOnlyEvent(r.item) && (
                  <button
                    type="button"
                    className={styles.planTimelineConflictCardMoveBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPushTomorrow(r.item);
                    }}
                    title={`Move "${stripEmojiFromTitle(r.item.title)}" to tomorrow`}
                  >
                    → Move to tomorrow
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {/* Inline action bar — prototype style */}
        <div className={styles.planTimelineConflictPairActions}>
          <AlertTriangle size={13} strokeWidth={2} className={styles.planTimelineConflictPairIcon} aria-hidden />
          <span className={styles.planTimelineConflictPairLabelText}>
            {items.length} events overlap
          </span>
          <div className={styles.planTimelineConflictPillGroup}>
            <button
              type="button"
              className={styles.planTimelineConflictAutoBtn}
              onClick={handleAutoMove}
              disabled={!freeRow}
              title={
                freeRow
                  ? `Move "${movable?.item?.title}" to next free window`
                  : "No free window available right now"
              }
            >
              <RotateCw size={12} strokeWidth={2.1} aria-hidden />
              {freeRow ? "Auto-arrange" : "No free window"}
            </button>
            {items.filter((r) => !isReadOnlyEvent(r.item)).map((r) => (
              <button
                key={`edit-${r.id}`}
                type="button"
                className={styles.planTimelineConflictItemBtn}
                onClick={() => onEdit?.(r.item, r.item.tag)}
                title={`Edit ${stripEmojiFromTitle(r.item.title)}`}
              >
                <span aria-hidden>✎</span>
                <span className={styles.planTimelineConflictItemText}>{stripEmojiFromTitle(r.item.title)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
