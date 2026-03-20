/*
 * Grouped row for overlapping events in the mini timeline.
 */

import { isReadOnlyEvent } from "../../../../components/Calendar/utils/eventUtils";
import { isDuringSleepWindow } from "../../../../components/Settings/hooks/useSleepWarning";
import { getGapStartDate } from "../../utils/timelineUtils";
import { getConflictTimeLabel } from "./helpers/conflictRowUtils";
import { getEventAccentColor } from "./helpers/eventAccent";
import { ConflictActions, ConflictCard } from "./parts/ConflictPairParts";
import { TimelineGutter, TimelineRowLayout, TimelineSpineCell } from "./parts/TimelineRowLayout";

function getMovableRows(items, rows, rowEndMins) {
  const movableWithGap = items.find((itemRow) => !itemRow.isReadOnly && rows.find((row) => row.type === "free" && row.gapStartMins >= rowEndMins && row.minutes >= itemRow.durationMins));
  const movable = movableWithGap || items.find((itemRow) => !itemRow.isReadOnly) || null;
  const freeRow = movableWithGap ? rows.find((row) => row.type === "free" && row.gapStartMins >= rowEndMins && row.minutes >= movableWithGap.durationMins) : null;
  return { movable, freeRow };
}

function enrichItemRows(items, getTag, sleepWindow) {
  return items.map((itemRow) => ({ ...itemRow, isReadOnly: isReadOnlyEvent(itemRow.item), accent: getEventAccentColor(itemRow.item.title, getTag?.(itemRow.item.tag)?.name ?? itemRow.item.tag_name ?? ""), isSleepTime: Boolean(itemRow.item.start_time && isDuringSleepWindow(sleepWindow?.sleepTime || "23:00", sleepWindow?.wakeTime || "07:00", new Date(itemRow.item.start_time))) }));
}

function handleActivate(event, itemRow, onCardClick, onEdit) {
  const rect = event.currentTarget.getBoundingClientRect();
  if (onCardClick) return onCardClick(itemRow.item, null, rect);
  if (!itemRow.isReadOnly) onEdit?.(itemRow.item, itemRow.item.tag);
}

export function ConflictPairRow({ row, rows, onConflictAutoMove, onPushTomorrow, onCardClick, onEventContextMenu, onEdit, getTag, styles, selectedDate, sleepWindow }) {
  const items = enrichItemRows(row.items, getTag, sleepWindow);
  const { movable, freeRow } = getMovableRows(items, rows, row.endMins);
  const onAutoMove = () => freeRow && movable && onConflictAutoMove && onConflictAutoMove(movable.item, getGapStartDate(selectedDate, freeRow.gapStartMins), new Date(getGapStartDate(selectedDate, freeRow.gapStartMins).getTime() + movable.durationMins * 60000));
  return <TimelineRowLayout row={row} styles={styles}><TimelineGutter row={row} styles={styles} timeLabel={getConflictTimeLabel(row)} /><TimelineSpineCell styles={styles} /><div className={styles.planTimelineConflictPairWrap}><div className={styles.planTimelineConflictPairCards}>{items.map((itemRow) => <ConflictCard key={itemRow.id} itemRow={itemRow} styles={styles} isReadOnly={itemRow.isReadOnly} accent={itemRow.accent} isSleepTime={itemRow.isSleepTime} onContextMenu={(event) => !itemRow.isReadOnly && (event.preventDefault(), event.stopPropagation(), onEventContextMenu?.(itemRow.item, event.clientX, event.clientY))} onActivate={(event) => handleActivate(event, itemRow, onCardClick, onEdit)} onMoveTomorrow={() => onPushTomorrow?.(itemRow.item)} canMoveTomorrow={!freeRow && onPushTomorrow && !itemRow.isReadOnly} />)}</div><ConflictActions styles={styles} items={items} freeRow={freeRow} movable={movable} onAutoMove={onAutoMove} onEdit={onEdit} /></div></TimelineRowLayout>;
}
