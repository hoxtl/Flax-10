export function ViewModeToggle({
  viewMode,
  dispatch,
  modes = ["day", "week", "month", "year"],
}) {
  return (
    <div className="view-toggle">
      <select
        value={viewMode}
        onChange={(e) =>
          dispatch({ type: "SET_VIEW_MODE", payload: e.target.value })
        }
        className="view-select"
      >
        {modes.map((m) => (
          <option key={m} value={m}>
            {capitalize(m)}
          </option>
        ))}
      </select>
    </div>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
