export function WeekdayHeader() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
        <div className="weekday-header">
            {days.map(d => <div key={d} className="weekday-label">{d}</div>)}
        </div>
    );
}
