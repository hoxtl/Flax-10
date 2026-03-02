import { formatSlotLabel, getSlotsOfDay } from '../DayView/dayViewHelpers';
import { SLOT_INTERVAL_MINUTES, SLOT_PIXEL_HEIGHT } from '../calendarConstants';

/**
 * Column of time labels (12 AM, 1 AM, etc.) on the left side of week view.
 */
export function TimeLabels() {
    const slots = getSlotsOfDay(SLOT_INTERVAL_MINUTES);
    return (
        <div className="time-labels">
            {slots.map(slotStartMinutes => (
                <div key={slotStartMinutes} className="time-label-cell" style={{ height: SLOT_PIXEL_HEIGHT }}>
                    {formatSlotLabel(slotStartMinutes)}
                </div>
            ))}
        </div>
    );
}
