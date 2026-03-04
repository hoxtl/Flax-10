/**
 * Conflict pair row — two (or more) overlapping events shown side-by-side
 * with an inline action bar below. No floating popover.
 */

import { AlertTriangle, RotateCw, Pencil } from "lucide-react";
import { formatTime } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { DAY_START_HOUR } from "../../utils/timelineUtils";
import { CAMPUS_DISPLAY } from "../../utils/planTimelineRows";

const EVENT_ACCENTS = {
  lecture:  "#84A98C",
  routine:  "#A0A09A",
  wellness: "#C0714E",
  study:    "#7B9BAD",
  social:   "#9A8CB0",
  meeting:  "#B8956A",
  default:  "#A08B72",
};

function getAccent(title, tagName) {
  const t = (title || "").toLowerCase();
  const tn = (tagName || "").toLowerCase();
  if (tn === "lecture" || /^lecture:/i.test(title)) return EVENT_ACCENTS.lecture;
  if (tn === "routine" || /^(breakfast|lunch|dinner)$/i.test(title.trim())) return EVENT_ACCENTS.routine;
  if (tn === "wellness" || /\b(gym|yoga|run|pilates|swim)\b/.test(t)) return EVENT_ACCENTS.wellness;
  if (/\b(study|library|review|revision)\b/.test(t)) return EVENT_ACCENTS.study;
  if (/\b(meeting|seminar|tutorial|office hours)\b/.test(t)) return EVENT_ACCENTS.meeting;
  if (/kclsu|society|social|flatmates/i.test(t)) return EVENT_ACCENTS.social;
  return EVENT_ACCENTS.default;
}

export function ConflictPairRow({
  row,
  rows,
  onConflictAutoMove,
  onEdit,
  getTag,
  styles,
  selectedDate,
}) {
  const { items } = row;
  const timeStr =
    String(Math.floor(DAY_START_HOUR + row.startMins / 60)).padStart(2, "0") +
    ":" +
    String(row.startMins % 60).padStart(2, "0");

  // Find the best candidate to auto-move: the one with a free window after the conflict
  const movable = items.find((r) => {
    const freeRow = rows.find(
      (fr) => fr.type === "free" && fr.gapStartMins >= row.endMins && fr.minutes >= r.durationMins,
    );
    return !!freeRow;
  });
  const freeRow = movable
    ? rows.find(
        (fr) => fr.type === "free" && fr.gapStartMins >= row.endMins && fr.minutes >= movable.durationMins,
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
      {/* Spine — terracotta dot */}
      <div className={styles.planTimelineSpineCell}>
        <span
          className={`${styles.planTimelineNode} ${styles.planTimelineNodeDot}`}
          style={{ "--node-color": "#C0714E" }}
          aria-hidden
        />
      </div>
      {/* Conflict group */}
      <div className={styles.planTimelineConflictPairWrap}>
        {/* Side-by-side cards */}
        <div className={styles.planTimelineConflictPairCards}>
          {items.map((r) => {
            const tagName = getTag?.(r.item.tag)?.name ?? r.item.tag_name ?? "";
            const accent = getAccent(r.item.title, tagName);
            const start = r.item.start_time ? formatTime(r.item.start_time) : "";
            const end = r.item.end_time ? formatTime(r.item.end_time) : "";
            return (
              <div
                key={r.id}
                className={styles.planTimelineConflictPairCard}
                style={{ "--card-accent": accent }}
                role="button"
                tabIndex={0}
                onClick={() => onEdit?.(r.item, r.item.tag)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onEdit?.(r.item, r.item.tag);
                  }
                }}
                title={`${r.item.title} — ${start}–${end}. Click to edit.`}
              >
                <div className={styles.planTimelineConflictPairCardAccent} aria-hidden />
                <span className={styles.planTimelineConflictPairCardTime}>
                  {start}{end && end !== start ? `–${end}` : ""}
                </span>
                <span className={styles.planTimelineConflictPairCardTitle}>
                  {stripEmojiFromTitle(r.item.title)}
                </span>
              </div>
            );
          })}
        </div>
        {/* Inline action bar */}
        <div className={styles.planTimelineConflictPairActions}>
          <AlertTriangle size={11} strokeWidth={2.5} className={styles.planTimelineConflictPairIcon} aria-hidden />
          <span className={styles.planTimelineConflictPairLabel}>
            {items.length} events overlap
          </span>
          <div className={styles.planTimelineConflictPairBtns}>
            <button
              type="button"
              className={`${styles.planTimelineConflictPairBtn} ${styles.planTimelineConflictPairBtnPrimary}`}
              onClick={handleAutoMove}
              disabled={!freeRow}
              title={freeRow ? `Move "${movable?.item?.title}" to next free window` : "No free window found"}
            >
              <RotateCw size={11} strokeWidth={2} aria-hidden />
              {freeRow ? "Auto-arrange" : "No free window"}
            </button>
            {items.map((r) => (
              <span
                key={r.id}
                className={styles.planTimelineConflictPairLabel}
                title={`Edit "${r.item.title}"`}
              >
                <button
                  type="button"
                  className={styles.planTimelineConflictPairLabelBtn}
                  onClick={() => onEdit?.(r.item, r.item.tag)}
                  aria-label={`Edit ${stripEmojiFromTitle(r.item.title)}`}
                >
                  <Pencil size={10} strokeWidth={2} aria-hidden />
                  {stripEmojiFromTitle(r.item.title).slice(0, 18)}
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
