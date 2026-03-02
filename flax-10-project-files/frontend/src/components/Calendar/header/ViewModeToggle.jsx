export function ViewModeToggle({ viewMode, dispatch }) {
    const modes = ['day', 'week', 'month', 'year'];

    return (
        <div className="view-toggle" role="tablist" aria-label="Calendar view mode">
            {modes.map((mode) => (
                <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={viewMode === mode}
                    className={`view-chip ${viewMode === mode ? 'active' : ''}`}
                    onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: mode })}
                >
                    {capitalize(mode)}
                </button>
            ))}
        </div>
    );
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
