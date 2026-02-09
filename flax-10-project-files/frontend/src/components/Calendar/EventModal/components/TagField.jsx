import { useTags } from '../../../../context/TagContext';

export function TagField({ value, onChange }) {
    const { tags } = useTags();

    return (
        <div className="form-field">
            <label htmlFor="field-tag">Type</label>
            <select id="field-tag" value={value || ''} onChange={onChange}>
                {tags.map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.label}</option>
                ))}
            </select>
        </div>
    );
}
