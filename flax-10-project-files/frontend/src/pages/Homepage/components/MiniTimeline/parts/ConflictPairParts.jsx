/*
 * Reusable subcomponents for grouped conflict rows.
 */

import { AlertTriangle, RotateCw } from "lucide-react";
import { formatTime } from "../../../utils/dateFormatUtils";
import { stripEmojiFromTitle } from "../../../utils/eventUtils";

export function ConflictCard({ itemRow, styles, accent, isSleepTime, onContextMenu, onActivate, onMoveTomorrow, canMoveTomorrow }) {
  const start = itemRow.item.start_time ? formatTime(itemRow.item.start_time) : "";
  const end = itemRow.item.end_time ? formatTime(itemRow.item.end_time) : "";
  const title = stripEmojiFromTitle(itemRow.item.title);
  return <div className={styles.planTimelineConflictPairCard} role="button" tabIndex={0} onContextMenu={onContextMenu} onClick={onActivate} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && (event.preventDefault(), onActivate(event))} style={{ "--card-accent": accent, cursor: "pointer" }}><div className={styles.planTimelineConflictPairCardAccent} aria-hidden /><span className={styles.planTimelineConflictPairCardTime}>{start}{end && end !== start ? `–${end}` : ""}</span><div className={styles.planTimelineConflictPairCardTitleRow}><span className={styles.planTimelineConflictPairCardTitle}>{title}</span>{isSleepTime ? <span className={styles.planTimelineConflictSleepBadge} title="Scheduled during sleep hours" aria-label="Scheduled during sleep hours">😴</span> : null}</div>{canMoveTomorrow ? <button type="button" className={styles.planTimelineConflictCardMoveBtn} onClick={(event) => { event.stopPropagation(); onMoveTomorrow(); }} title={`Move "${title}" to tomorrow`}>→ Move to tomorrow</button> : null}</div>;
}

export function ConflictActions({ styles, items, freeRow, movable, onAutoMove, onEdit }) {
  return <div className={styles.planTimelineConflictPairActions}><AlertTriangle size={13} strokeWidth={2} className={styles.planTimelineConflictPairIcon} aria-hidden /><span className={styles.planTimelineConflictPairLabelText}>{items.length} events overlap</span><div className={styles.planTimelineConflictPillGroup}><button type="button" className={styles.planTimelineConflictAutoBtn} onClick={onAutoMove} disabled={!freeRow} title={freeRow ? `Move "${movable?.item?.title}" to next free window` : "No free window available right now"}><RotateCw size={12} strokeWidth={2.1} aria-hidden />{freeRow ? "Auto-arrange" : "No free window"}</button>{items.filter((itemRow) => !itemRow.isReadOnly).map((itemRow) => <button key={`edit-${itemRow.id}`} type="button" className={styles.planTimelineConflictItemBtn} onClick={() => onEdit?.(itemRow.item, itemRow.item.tag)} title={`Edit ${stripEmojiFromTitle(itemRow.item.title)}`}><span aria-hidden>✎</span><span className={styles.planTimelineConflictItemText}>{stripEmojiFromTitle(itemRow.item.title)}</span></button>)}</div></div>;
}
