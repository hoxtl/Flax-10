import { YearMonth } from './YearMonth';

export function YearGrid({ year, events }) {
    const months = Array.from({ length: 12 }, (_, i) => i);
    return (
        <div className="year-grid">
            {months.map(m => <YearMonth key={m} year={year} monthIndex={m} events={events} />)}
        </div>
    );
}
