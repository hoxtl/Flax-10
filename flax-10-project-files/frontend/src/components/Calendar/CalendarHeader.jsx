import { useCalendar, useCalendarDispatch } from "../../context/CalendarContext";
import { addDays, formatDate, getWeekDays, formatMonthYear } from "../../utils/dateUtils";
import './CalendarHeader.css';

/**
 * The top bar of the calendar with navigation arrows and view mode buttons.
 * shows the current date and lets users switch between day/week/month views.
 */
export function CalendarHeader() {
    const { selectedDate, viewMode } = useCalendar();
    const dispatch = useCalendarDispatch();

    // Moves forward or backward by the appropriate amount based on current view.
    // direction: 1 for forward, -1 for backward
    const navigate = (direction) => {
        const multipliers = { day: 1, week: 7, month: 30 };
        const newDate = addDays(selectedDate, multipliers[viewMode] * direction);
        dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
    };
    const week = getWeekDays(selectedDate);
    const title = {
        day: formatDate(selectedDate),
        week: `${week[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${week[6].toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
        month: formatMonthYear(selectedDate)
    }[viewMode];

    return (
        <div className="calendar-header">
            <div className="nav-buttons">
                <button onClick={() => navigate(-1)}>&lt;</button>
                <button onClick={() => navigate(1)}>&gt;</button>
            </div>
            <h2 className="calendar-title">{title}</h2>
            <ViewModeToggle viewMode={viewMode} dispatch={dispatch} />
        </div>
    );
}


// Left/right arrow buttons for navigating dates
function NavigationButtons({ onNavigate }) {
    return (
        <div className="nav-buttons">
            <button onClick={() => onNavigate(-1)}>&lt;</button>
            <button onClick={() => onNavigate(1)}>&gt;</button>
        </div>
    );
}

// Buttons to switch between day, week, and month views
function ViewModeToggle({ viewMode, dispatch }) {
    const modes = ['day', 'week', 'month'];
    const buttons = modes.map((m) => (
        <button
            key={m}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: m })}
            className={viewMode === m ? 'active' : ''}
        >
            {m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
    ));
    return <div className="view-toggle">{buttons}</div>;
}

// Figures out how many days to jump based on the view
// Day view jumps 1 day, week view jumps 7 days, month view jumps ~30 days
function getNavigationDays(viewMode, direction) {
    const multipliers = { day: 1, week: 7, month: 30 };
    return multipliers[viewMode] * direction;
}