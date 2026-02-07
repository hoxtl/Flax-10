import { getHoursOfDay, formatHour } from '../DayView/dayViewHelpers';
import { SLOT_HEIGHT } from '../calendarConstants';

/**
 * Column of time labels (12 AM, 1 AM, etc.) on the left side of week view.
 */
export function TimeLabels() {
    const hours = getHoursOfDay();
    const timeLabelCells = hours.map(hour => (
        <div
            key={hour}
            className="time-label-cell"
            style={{ height: SLOT_HEIGHT }}>
            {formatHour(hour)}
        </div>
    ));
    return (
        <div className="time-labels">
            {timeLabelCells}
        </div>
    );
}