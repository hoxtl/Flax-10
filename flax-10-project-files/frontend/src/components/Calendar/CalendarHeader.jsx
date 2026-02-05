import { useCalendar, useCalendarDispatch } from "../../context/CalendarContext";
import { addDays, formatDate } from "../../utils/dateUtils";
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
        const days = getNavigationDays(viewMode, direction);
        const newDate = addDays(selectedDate, days);
        dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
    };
    return (
        <div className="calendar-header">
            <NavigationButtons onNavigate={navigate} />
            <h2 className="calendar-title">{formatDate(selectedDate)}</h2>
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
    return (
        <div className="view-toggle">
            {modes.map((mode) => (
                <button
                    key={mode}
                    onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: mode })}
                    className={viewMode === mode ? 'active' : ''}
                >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
            ))}
        </div>
    );
}

// Figures out how many days to jump based on the view
// Day view jumps 1 day, week view jumps 7 days, month view jumps ~30 days
function getNavigationDays(viewMode, direction) {
    const multipliers = { day: 1, week: 7, month: 30 };
    return multipliers[viewMode] * direction;
}