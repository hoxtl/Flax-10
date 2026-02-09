export function RecurrenceField({ value, onChange }) {
    return (
        <div className="form-field">
            <label htmlFor="field-recurrence">Recurrence</label>
            <select id="field-recurrence" value={value || 'none'} onChange={onChange}>
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
            </select>
        </div>
    );
}
