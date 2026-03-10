import { memo } from 'react';
import { YearMonth } from './YearMonth';

export const YearGrid = memo(function YearGrid({ year, events }) {
    const months = Array.from({ length: 12 }, (_, i) => i);
    return (
        <div className="year-grid">
            {months.map(m => <YearMonth key={m} year={year} monthIndex={m} events={events} />)}
        </div>
    );
});
