import { useTimeSlotDrop } from '../../hooks/useTimeSlotDrop';
import { useResizeHighlight } from '../../../../context/ResizeHighlightContext';
import { isSameDay } from '../../utils/dateUtils';
import { SLOT_INTERVAL_MINUTES, SLOT_PIXEL_HEIGHT, SNAP_INTERVAL } from '../../calendarConstants';
import { HighlightOverlay } from './HighlightOverlay';

export function HourCell({ slotStartMinutes, date, readOnly }) {
    if (readOnly) return <div className="hour-cell" style={{ height: SLOT_PIXEL_HEIGHT }} />;
    const { props, hl, target, segment } = useHourCellLogic(slotStartMinutes, date);
    const segmentsPerSlot = SLOT_INTERVAL_MINUTES / SNAP_INTERVAL;
    return (
        <div className={`hour-cell${hl ? ' drop-target' : ''}`} style={{ height: SLOT_PIXEL_HEIGHT }} {...props}>
            {hl && <HighlightOverlay segment={segment} segmentCount={segmentsPerSlot} type={target ? 'resize' : 'drop'} />}
        </div>
    );
}

function useHourCellLogic(slotStartMinutes, date) {
    const { mergedProps, isOver, highlightSegment } = useTimeSlotDrop(slotStartMinutes, date);
    const { resizeHighlight } = useResizeHighlight();
    const isTarget = isResizeTarget(resizeHighlight, slotStartMinutes, date);
    const hl = isOver || isTarget;
    const segment = isOver ? highlightSegment : (isTarget ? resizeHighlight?.segment : null);
    return { props: mergedProps, hl, target: isTarget, segment };
}

function isResizeTarget(resizeHighlight, slotStartMinutes, date) {
    if (!resizeHighlight) return false;
    return resizeHighlight.slotStartMinutes === slotStartMinutes && isSameDay(resizeHighlight.date, date);
}
