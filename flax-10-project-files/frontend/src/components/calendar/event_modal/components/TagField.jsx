import { useState } from 'react';
import { useTags } from '../../../../context/TagContext';
import { TagsSelector } from '../../../common/tags_selector/TagsSelector';
<<<<<<< HEAD
import TagManagerModal from '../../../tags/components/TagManagerModal';
=======
import TagManagerModal from '../../../tags/TagManagerModal';
>>>>>>> main
function getSelectionHandler(onChange) {
    return (s) => onChange({ target: { value: s.length ? s[s.length - 1].id : '' } });
}
export function TagField({ value, onChange, customTags }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags || [];
    const [manager, setManager] = useState(false);
    const unique = Array.from(new Map(tags.map(t => [t.label.toLowerCase(), t])).values());
    const selected = unique.filter(t => String(t.id) === String(value));
    return (
        <div className="form-field">
            <div className="tag-field-header">
                <label>Type</label>
                <button type="button" className="tag-manage-btn" onClick={() => setManager(true)}>Manage tags…</button>
            </div>
            <TagsSelector tags={unique} selectedTags={selected} onSelectionChange={getSelectionHandler(onChange)} emptyHint="Select event type…" />
            {manager && <TagManagerModal onClose={() => setManager(false)} />}
        </div>
    );
}

