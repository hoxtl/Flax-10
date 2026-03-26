import { HourCell } from './HourCell';
import { getHoursOfDay } from '../../day_view/dayViewHelpers';

export function HourList({ date, readOnly }) {
    const hours = getHoursOfDay();
    return (
        <>
            {hours.map(hour => (
                <HourCell key={hour} hour={hour} date={date} readOnly={readOnly} />
            ))}
        </>
    );
}
