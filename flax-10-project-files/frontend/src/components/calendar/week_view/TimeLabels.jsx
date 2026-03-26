import { getHoursOfDay, formatHour } from '../day_view/dayViewHelpers';
import { SLOT_HEIGHT } from '../calendarConstants';

/**
 * Column of time labels (12 AM, 1 AM, etc.) on the left side of week view.
 */

export function TimeLabels() {
    return (
        <div className="time-labels">
            {getHoursOfDay().map(h => (
                <div key={h} className="time-label-cell" style={{ height: SLOT_HEIGHT }}>
                    {formatHour(h)}
                </div>
            ))}
        </div>
    );
}