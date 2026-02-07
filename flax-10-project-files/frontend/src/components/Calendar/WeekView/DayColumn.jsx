import { ColumnEvents } from './components/ColumnEvents';
import { HourList } from './components/HourList';

export function DayColumn({ date, events }) {
    return (
        <div className="day-column">
            <HourList date={date} />
            <ColumnEvents events={events} />
        </div>
    );
}
