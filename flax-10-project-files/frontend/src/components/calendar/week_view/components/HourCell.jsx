import { useTimeSlotDrop } from '../../hooks/useTimeSlotDrop';
import { useResizeHighlight } from '../../../../context/ResizeHighlightContext';
import { isSameDay } from '../../utils/dateUtils';
import { SLOT_HEIGHT } from '../../calendarConstants';
import { HighlightOverlay } from './HighlightOverlay';

export function HourCell({ hour, date, readOnly }) {
    if (readOnly) return <div className="hour-cell" style={{ height: SLOT_HEIGHT }} />;
    const { props, hl, target, quarter } = useHourCellLogic(hour, date);
    return (
        <div className={`hour-cell${hl ? ' drop-target' : ''}`} style={{ height: SLOT_HEIGHT }} {...props}>
            {hl && <HighlightOverlay quarter={quarter} type={target ? 'resize' : 'drop'} />}
        </div>
    );
}

function useHourCellLogic(hour, date) {
    const { mergedProps, isOver, highlightQuarter } = useTimeSlotDrop(hour, date);
    const { resizeHighlight } = useResizeHighlight();
    const isTarget = isResizeTarget(resizeHighlight, hour, date);
    const hl = isOver || isTarget;
    const quarter = isOver ? highlightQuarter : (isTarget ? resizeHighlight?.quarter : null);
    return { props: mergedProps, hl, target: isTarget, quarter };
}

function isResizeTarget(resizeHighlight, hour, date) {
    if (!resizeHighlight) return false;
    return resizeHighlight.hour === hour && isSameDay(resizeHighlight.date, date);
}
