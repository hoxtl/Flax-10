import { useTimeSlotDrop } from '../useTimeSlotDrop';

export function TimeSlot({ hour, date }) {
    const { mergedProps, isOver, highlightQuarter } = useTimeSlotDrop(hour, date);

    return (
        <div className={`time-slot${isOver ? ' drop-target' : ''}`} {...mergedProps}>
            {isOver && highlightQuarter !== null && (
                <div
                    className="quarter-highlight"
                    style={{ top: `${highlightQuarter * 25}%` }}
                />
            )}
        </div>
    );
}
