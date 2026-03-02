import { useTimeSlotDrop } from '../hooks/useTimeSlotDrop';
import { useResizeHighlight } from '../../../context/ResizeHighlightContext';
import { isSameDay } from '../utils/dateUtils';
import { SLOT_INTERVAL_MINUTES, SNAP_INTERVAL } from '../calendarConstants';

export function TimeSlot({ slotStartMinutes, date, readOnly }) {
    if (readOnly) return <div className="time-slot" />;
    return <InteractiveTimeSlot slotStartMinutes={slotStartMinutes} date={date} />;
}

function InteractiveTimeSlot({ slotStartMinutes, date }) {
    const { mergedProps, isOver, highlightSegment } = useTimeSlotDrop(slotStartMinutes, date);
    const { resizeHighlight } = useResizeHighlight();
    const isResizeTarget = checkResizeTarget(resizeHighlight, slotStartMinutes, date);
    const highlight = getHighlightState(isOver, isResizeTarget, highlightSegment, resizeHighlight);
    const segmentsPerSlot = SLOT_INTERVAL_MINUTES / SNAP_INTERVAL;

    return (
        <div className={`time-slot${highlight.show ? ' drop-target' : ''}`} {...mergedProps}>
            <HighlightIndicator type="quarter" show={isOver} segment={highlight.segment} segmentCount={segmentsPerSlot} />
            <HighlightIndicator type="resize" show={isResizeTarget} segment={highlight.segment} segmentCount={segmentsPerSlot} />
        </div>
    );
}

function checkResizeTarget(resizeHighlight, slotStartMinutes, date) {
    return resizeHighlight && resizeHighlight.slotStartMinutes === slotStartMinutes && isSameDay(resizeHighlight.date, date);
}

function getHighlightState(isOver, isResizeTarget, highlightSegment, resizeHighlight) {
    return {
        show: isOver || isResizeTarget,
        segment: isOver ? highlightSegment : resizeHighlight?.segment
    };
}

function HighlightIndicator({ type, show, segment, segmentCount }) {
    if (!show || segment === null) return null;
    const className = type === 'quarter' ? 'quarter-highlight' : 'resize-line-highlight';
    const segmentHeight = `${100 / segmentCount}%`;
    return <div className={className} style={{ top: `calc(${segmentHeight} * ${segment})`, '--segment-height': segmentHeight }} />;
}
