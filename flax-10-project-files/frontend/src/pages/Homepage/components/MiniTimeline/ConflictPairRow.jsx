/**
 * Conflict pair row — two (or more) overlapping events shown side-by-side
 * with an inline action bar below. No floating popover.
 */

import { AlertTriangle } from "lucide-react";
import { formatTime, formatHour12h } from "../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../utils/eventUtils";
import { getGapStartDate } from "../../utils/timelineUtils";
import { DAY_START_HOUR } from "../../utils/timelineUtils";
import { CAMPUS_DISPLAY } from "../../utils/planTimelineRows";

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
  onEdit,
  getTag,
  styles,
  selectedDate,
}) {
  const { items } = row;
  const timeStr = formatHour12h(
    Math.floor(DAY_START_HOUR + row.startMins / 60),
    row.startMins % 60
  );

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
        {/* Inline action bar — simplified */}
        <div className={styles.planTimelineConflictPairActions}>
          <AlertTriangle size={13} strokeWidth={2} className={styles.planTimelineConflictPairIcon} aria-hidden />
          <span className={styles.planTimelineConflictPairLabelText}>
            {items.length} events overlap
          </span>
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
            {freeRow ? "Auto-arrange" : "No free window"}
          </button>
          {items.map((r) => (
            <button
              key={`resolve-${r.id}`}
              type="button"
              className={styles.planTimelineConflictItemBtn}
              onClick={() => onEdit?.(r.item, r.item.tag)}
              title={`Open "${stripEmojiFromTitle(r.item.title)}"`}
            >
              ✎ {stripEmojiFromTitle(r.item.title)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
