import { useTags } from '../../../../context/TagContext';
import AnimatedDropdown from '../../../ui/AnimatedDropdown';

export function TagField({ value, onChange, customTags }) {
    const globalTags = useTags();
    const tags = customTags || globalTags.tags;

    // Deduplicate tags by label to prevent duplicates like "Schedule"
    const uniqueTags = Array.from(
        new Map((tags || []).map(t => [t.label, t])).values()
    );
    const options = uniqueTags.map(tag => ({ value: tag.id, label: tag.label }));

    return (
        <div className="form-field">
            <label htmlFor="field-tag">Type</label>
            <AnimatedDropdown
                value={value || ''}
                onChange={(val) => onChange({ target: { value: val } })}
                options={options}
                placeholder="Select type"
                align="left"
            />
        </div>
    );
}
