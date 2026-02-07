import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';

export function ViewModeToggle({ viewMode, dispatch }) {
    const modes = ['day', 'week', 'month'];
    return (
        <div className="view-toggle">
            {modes.map(m => <ModeButton key={m} mode={m} active={viewMode === m} dispatch={dispatch} />)}
        </div>
    );
}

function ModeButton({ mode, active, dispatch }) {
    const label = mode.charAt(0).toUpperCase() + mode.slice(1);
    const onClick = () => dispatch({ type: 'SET_VIEW_MODE', payload: mode });
    return <button onClick={onClick} className={active ? 'active' : ''}>{label}</button>;
}
