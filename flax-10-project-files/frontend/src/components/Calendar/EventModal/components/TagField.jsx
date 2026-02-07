const TAG_OPTIONS = [
    { value: '', label: 'None' },
    { value: 'class', label: 'Class' },
    { value: 'study', label: 'Study Block' },
    { value: 'task', label: 'Task' },
    { value: 'other', label: 'Other' },
];

export function TagField({ value, onChange }) {
    return (
        <div className="form-field">
            <label htmlFor="field-tag">Type</label>
            <select id="field-tag" value={value || ''} onChange={onChange}>
                {TAG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
}
