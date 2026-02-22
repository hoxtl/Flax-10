import { useTimeSlotDrop } from '../hooks/useTimeSlotDrop';
import { useResizeHighlight } from '../../../context/ResizeHighlightContext';
import { isSameDay } from '../utils/dateUtils';

export function TimeSlot({ hour, date, readOnly }) {
    if (readOnly) return <div className="time-slot" />;
    return <InteractiveTimeSlot hour={hour} date={date} />;
}

function InteractiveTimeSlot({ hour, date }) {
    const { mergedProps, isOver, highlightQuarter } = useTimeSlotDrop(hour, date);
    const { resizeHighlight } = useResizeHighlight();
    const isResizeTarget = checkResizeTarget(resizeHighlight, hour, date);
    const highlight = getHighlightState(isOver, isResizeTarget, highlightQuarter, resizeHighlight);

    return (
        <div className={`time-slot${highlight.show ? ' drop-target' : ''}`} {...mergedProps}>
            <HighlightIndicator type="quarter" show={isOver} quarter={highlight.quarter} />
            <HighlightIndicator type="resize" show={isResizeTarget} quarter={highlight.quarter} />
        </div>
    );
}

function checkResizeTarget(resizeHighlight, hour, date) {
    return resizeHighlight && resizeHighlight.hour === hour && isSameDay(resizeHighlight.date, date);
}

function getHighlightState(isOver, isResizeTarget, highlightQuarter, resizeHighlight) {
    return {
        show: isOver || isResizeTarget,
        quarter: isOver ? highlightQuarter : resizeHighlight?.quarter
    };
}

function HighlightIndicator({ type, show, quarter }) {
    if (!show || quarter === null) return null;
    const className = type === 'quarter' ? 'quarter-highlight' : 'resize-line-highlight';
    return <div className={className} style={{ top: `${quarter * 25}%` }} />;
}
