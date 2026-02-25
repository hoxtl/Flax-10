import { useTags } from '../../../../context/TagContext';

export function TagField({ value, onChange, customTags }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;
    const handleSelect = (tagId) => {
        const synthetic = { target: { value: tagId === null ? '' : String(tagId) } };
        onChange(synthetic);
    };

    return (
        <div className="type-pills-wrap">
            <span className="type-pills-label" id="field-tag-label">Type</span>
            <div className="type-pills" role="group" aria-labelledby="field-tag-label">
                <button
                    type="button"
                    className={`type-pill ${!value ? 'selected' : ''}`}
                    onClick={() => handleSelect(null)}
                >
                    <span className="type-pill-dot" style={{ background: '#9ca3af' }} aria-hidden />
                    None
                </button>
                {(tags || []).map(tag => (
                    <button
                        key={tag.id}
                        type="button"
                        className={`type-pill ${value == tag.id ? 'selected' : ''}`}
                        onClick={() => handleSelect(tag.id)}
                    >
                        <span
                            className="type-pill-dot"
                            style={{ background: tag.color || '#9ca3af' }}
                            aria-hidden
                        />
                        {tag.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
