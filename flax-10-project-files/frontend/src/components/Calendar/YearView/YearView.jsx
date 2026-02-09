import { useCalendar } from '../../../context/CalendarContext';
import { YearGrid } from './YearGrid';
import './YearView.css';

export function YearView() {
    const { selectedDate, events } = useCalendar();
    const year = selectedDate.getFullYear();

    return (
        <div className="year-view">
            <YearGrid year={year} events={events} />
        </div>
    );
}
