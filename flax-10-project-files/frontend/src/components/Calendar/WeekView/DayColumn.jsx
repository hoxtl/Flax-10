import { ColumnEvents } from './components/ColumnEvents';
import { HourList } from './components/HourList';

export function DayColumn({ date, events, readOnly }) {
    return (
        <div className="day-column">
            <HourList date={date} readOnly={readOnly} />
            <ColumnEvents events={events} date={date} readOnly={readOnly} />
        </div>
    );
}
