import { useTimeSlotDrop } from '../../../hooks/useTimeSlotDrop';
import { useResizeHighlight } from '../../../context/ResizeHighlightContext';
import { isSameDay } from '../../../utils/dateUtils';

export function TimeSlot({ hour, date }) {
    const { mergedProps, isOver, highlightQuarter } = useTimeSlotDrop(hour, date);
    const { resizeHighlight } = useResizeHighlight();

    const isResizeTarget = resizeHighlight &&
        resizeHighlight.hour === hour &&
        isSameDay(resizeHighlight.date, date);

    const showHighlight = isOver || isResizeTarget;
    const quarter = isOver ? highlightQuarter : resizeHighlight?.quarter;

    return (
        <div className={`time-slot${showHighlight ? ' drop-target' : ''}`} {...mergedProps}>
            {isOver && quarter !== null && (
                <div className="quarter-highlight" style={{ top: `${quarter * 25}%` }} />
            )}
            {isResizeTarget && quarter !== null && (
                <div className="resize-line-highlight" style={{ top: `${quarter * 25}%` }} />
            )}
        </div>
    );
}
