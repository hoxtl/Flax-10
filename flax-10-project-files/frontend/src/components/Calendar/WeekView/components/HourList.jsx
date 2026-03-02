import { HourCell } from './HourCell';
import { getSlotsOfDay } from '../../DayView/dayViewHelpers';
import { SLOT_INTERVAL_MINUTES } from '../../calendarConstants';

export function HourList({ date, readOnly }) {
    const slots = getSlotsOfDay(SLOT_INTERVAL_MINUTES);
    return (
        <>
            {slots.map(slotStartMinutes => (
                <HourCell key={slotStartMinutes} slotStartMinutes={slotStartMinutes} date={date} readOnly={readOnly} />
            ))}
        </>
    );
}
