import { useTags } from '../../../../context/TagContext';

export function TagField({ value, onChange, customTags }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;

    if (!tags || tags.length === 0) return null;

    return (
        <div className="form-field">
            <label htmlFor="field-tag">Type</label>
            <select id="field-tag" value={value || ''} onChange={onChange}>
                {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.label}</option>)}
            </select>
        </div>
    );
}
