import AnimatedDropdown from '../../ui/AnimatedDropdown';

const VIEW_MODE_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

export function ViewModeToggle({ viewMode, dispatch }) {
  const handleChange = (val) => dispatch({ type: 'SET_VIEW_MODE', payload: val });
  return (
    <div className="view-toggle">
      <AnimatedDropdown value={viewMode} onChange={handleChange} options={VIEW_MODE_OPTIONS} placeholder="View" />
    </div>
  );
}
