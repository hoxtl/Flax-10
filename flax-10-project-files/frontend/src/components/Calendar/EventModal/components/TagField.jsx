import { useState } from 'react';
import { useTags } from '../../../../context/TagContext';
import { TagsSelector } from '../../../common/TagsSelector/TagsSelector';
import TagManagerModal from '../../../Tags/TagManagerModal';

/** Form field for selecting event tag/type via dropdown. */
export function TagField({ value, onChange, customTags }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;
    const [showManager, setShowManager] = useState(false);
    
    const uniqueTags = Array.from(
        new Map((tags || []).map(t => [t.label.toLowerCase(), t])).values()
    );

    const selectedTags = uniqueTags.filter(t => String(t.id) === String(value));

    const handleSelectionChange = (newSelection) => {
        if (newSelection.length === 0) {
            onChange({ target: { value: '' } });
        } else {
            const last = newSelection[newSelection.length - 1];
            onChange({ target: { value: last.id } });
        }
    };

    return (
        <>
            <div className="form-field">
                <div className="tag-field-header">
                    <label>Type</label>
                    <button type="button" className="tag-manage-btn" onClick={() => setShowManager(true)}>
                        Manage tags…
                    </button>
                </div>
                <TagsSelector
                    tags={uniqueTags}
                    selectedTags={selectedTags}
                    onSelectionChange={handleSelectionChange}
                    emptyHint="Select event type…"
                />
            </div>
            {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
        </>
    );
}

