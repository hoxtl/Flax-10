import { useTags } from '../../../../context/TagContext';

export function TagField({ value, onChange, customTags }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;
    const selectedTag = tags?.find(t => t.id === value);
    const hasColors = customTags && selectedTag?.color;

    if (!tags || tags.length === 0) return null;

    return (
        <div className="form-field">
            <label htmlFor="field-tag">Type</label>
            <div className={hasColors ? "select-with-color" : ""}>
                {hasColors && <span className="color-dot" style={{ backgroundColor: selectedTag.color }} />}
                <select id="field-tag" value={value || ''} onChange={onChange}>
                    {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.label}</option>)}
                </select>
            </div>
        </div>
    );
}
